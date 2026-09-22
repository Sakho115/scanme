import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/Navigation/AppShell';
import { CameraViewfinder } from '../components/Scanner/CameraViewfinder';
import { ManualTokenModal } from '../components/Scanner/ManualTokenModal';
import { ValidPassCard } from '../components/ParticipantCard/ValidPassCard';
import { SuccessState } from '../components/CheckinResult/SuccessState';
import { DuplicateState } from '../components/CheckinResult/DuplicateState';
import { InvalidState } from '../components/CheckinResult/InvalidState';
import { ErrorState } from '../components/CheckinResult/ErrorState';
import { UnauthorizedState } from '../components/CheckinResult/UnauthorizedState';
import { ScannerState, ScanResultData } from '../types/scanner';
import { extractTokenFromQR } from '../utils/qr';
import { soundController } from '../utils/audio';
import { attendanceService } from '../services/attendanceService';
import { authService } from '../services/authService';
import { getEventBySlug, VyugamEvent } from '../types/event';
import { AttendanceType } from '../types/attendance';
import { Loader2, QrCode, Building2 } from 'lucide-react';

interface AttendanceScannerPageProps {
  forcedType?: 'OVERALL';
}

export const AttendanceScannerPage: React.FC<AttendanceScannerPageProps> = ({ forcedType }) => {
  const { eventSlug } = useParams<{ eventSlug?: string }>();
  const navigate = useNavigate();
  const session = authService.getSession();

  const isOverall = forcedType === 'OVERALL' || !eventSlug;
  const attendanceType: AttendanceType = isOverall ? 'OVERALL' : 'EVENT';

  const [targetEvent, setTargetEvent] = useState<VyugamEvent | undefined>(undefined);
  const [isAuthorized, setIsAuthorized] = useState(true);

  const [state, setState] = useState<ScannerState>('idle');
  const [resultData, setResultData] = useState<ScanResultData | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const scanLockRef = useRef(false);

  // Validate coordinator authorization for this section
  useEffect(() => {
    if (!session) {
      navigate('/login', { replace: true });
      return;
    }

    if (isOverall) {
      // Overall attendance: Admin or Overall Coordinator
      const ok = session.role === 'ADMIN' || session.role === 'OVERALL_COORDINATOR';
      setIsAuthorized(ok);
      setTargetEvent(undefined);
    } else if (eventSlug) {
      const ev = getEventBySlug(eventSlug);
      setTargetEvent(ev);

      // Also dynamically resolve database event metadata to guarantee UUID consistency
      attendanceService.resolveEvent(eventSlug).then(dbEv => {
        if (dbEv) {
          setTargetEvent({
            id: dbEv.id,
            code: dbEv.code,
            slug: dbEv.slug || eventSlug,
            name: dbEv.name,
            description: dbEv.description || ev?.description || '',
            status: dbEv.status || 'ACTIVE'
          } as any);
        }
      });

      if (!ev) {
        setIsAuthorized(false);
        return;
      }

      // Event attendance: Admin or Assigned Event Coordinator
      if (session.role === 'ADMIN') {
        setIsAuthorized(true);
      } else if (session.role === 'EVENT_COORDINATOR') {
        const matches = session.assignedEventSlug === eventSlug || session.eventId === ev.id;
        setIsAuthorized(matches);
      } else {
        setIsAuthorized(false);
      }
    }
  }, [eventSlug, isOverall, navigate, session]);

  const sectionName = isOverall ? 'Overall Venue Entry' : targetEvent?.name || 'Event Entry';

  const handleResetToScanner = useCallback(() => {
    scanLockRef.current = false;
    setIsProcessing(false);
    setResultData(null);
    setState('scanning');
  }, []);

  const processToken = useCallback(
    async (rawInput: string) => {
      if (scanLockRef.current || isProcessing) return;

      const token = extractTokenFromQR(rawInput);
      if (!token) {
        soundController.playError();
        setState('invalid');
        setResultData({
          token: rawInput,
          attendanceType,
          eventId: targetEvent?.id,
          eventName: sectionName,
          errorMessage: 'Invalid QR token format'
        });
        return;
      }

      scanLockRef.current = true;
      setIsProcessing(true);
      setState('loading');
      setIsManualModalOpen(false);

      try {
        if (isOverall) {
          // Pre-check / validate pass for Overall Entry Gate
          const passRes = await attendanceService.validateParticipantPass(token);

          if (passRes.status === 'INVALID_TOKEN' || passRes.status === 'INACTIVE_PARTICIPANT') {
            soundController.playError();
            setState('invalid');
            setResultData({
              token,
              attendanceType,
              errorMessage: passRes.error || 'Pass not registered for this event.'
            });
            return;
          }

          if (passRes.status === 'ALREADY_CHECKED_IN') {
            soundController.playWarning();
            setState('duplicate');
            setResultData({
              token,
              attendanceType,
              participant: passRes.participant,
              participantId: passRes.participantId,
              previousCheckin: passRes.previousCheckin,
              selectedEvents: passRes.selectedEvents,
              eventName: sectionName
            });
            return;
          }

          if (passRes.status === 'VALID' && passRes.participant) {
            soundController.playSuccess();
            setState('valid');
            setResultData({
              token,
              attendanceType,
              participant: passRes.participant,
              participantId: passRes.participantId,
              eventName: sectionName
            });
            return;
          }

          // Error fallback
          soundController.playError();
          setState('network_error');
          setResultData({
            token,
            attendanceType,
            errorMessage: passRes.error || 'Failed to verify pass.'
          });
        } else {
          // Event Entry Gate check-in
          const checkinRes = await attendanceService.verifyAndCheckin({
            qrToken: token,
            attendanceType,
            eventId: targetEvent?.id || null,
            coordinatorId: session?.id || null
          });

          if (checkinRes.status === 'UNAUTHORIZED_EVENT') {
            soundController.playError();
            setState('unauthorized');
            setResultData({
              token,
              attendanceType,
              errorMessage: checkinRes.error || 'Unauthorized for this section.'
            });
            return;
          }

          if (checkinRes.status === 'INVALID_TOKEN' || checkinRes.status === 'INACTIVE_PARTICIPANT') {
            soundController.playError();
            setState('invalid');
            setResultData({
              token,
              attendanceType,
              errorMessage: checkinRes.error || 'Pass not registered for this event.'
            });
            return;
          }

          if (checkinRes.status === 'ALREADY_CHECKED_IN') {
            soundController.playWarning();
            setState('duplicate');
            setResultData({
              token,
              attendanceType,
              participant: checkinRes.participant,
              previousCheckin: checkinRes.previousCheckin,
              eventName: sectionName
            });
            return;
          }

          if (checkinRes.status === 'SUCCESS' && checkinRes.participant) {
            soundController.playSuccess();
            setState('approved');
            setResultData({
              token,
              attendanceType,
              participant: checkinRes.participant,
              eventName: sectionName,
              approvedTime: checkinRes.checkin?.checkinTime
            });
            return;
          }

          // Fallback error
          soundController.playError();
          setState('network_error');
          setResultData({
            token,
            attendanceType,
            errorMessage: checkinRes.error || 'Failed to verify pass.'
          });
        }
      } catch (err) {
        console.error('Scan processing error:', err);
        soundController.playError();
        setState('network_error');
        setResultData({
          token,
          attendanceType,
          errorMessage: 'Network or database connection problem. Please try again.'
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [attendanceType, isOverall, isProcessing, sectionName, session?.id, targetEvent?.id]
  );

  // When pass is confirmed, record overall entry + event selections atomically
  const handleConfirmCheckin = async (selectedEventIds: string[] = []) => {
    if (!resultData?.token) return;

    if (isOverall) {
      setIsProcessing(true);
      try {
        const checkinRes = await attendanceService.verifyAndCheckin({
          qrToken: resultData.token,
          attendanceType: 'OVERALL',
          eventIds: selectedEventIds,
          coordinatorId: session?.id || null
        });

        if (checkinRes.status === 'SUCCESS') {
          soundController.playSuccess();
          setState('approved');
          setResultData(prev =>
            prev
              ? {
                  ...prev,
                  approvedTime: checkinRes.checkin?.checkinTime,
                  selectedEvents: checkinRes.selectedEvents
                }
              : null
          );
        } else if (checkinRes.status === 'ALREADY_CHECKED_IN') {
          soundController.playWarning();
          setState('duplicate');
          setResultData(prev =>
            prev
              ? {
                  ...prev,
                  previousCheckin: checkinRes.previousCheckin,
                  selectedEvents: checkinRes.selectedEvents
                }
              : null
          );
        } else {
          soundController.playError();
          setState('network_error');
          setResultData(prev =>
            prev
              ? {
                  ...prev,
                  errorMessage: checkinRes.error || 'Failed to record entry.'
                }
              : null
          );
        }
      } catch (err: any) {
        soundController.playError();
        setState('network_error');
        setResultData(prev =>
          prev
            ? {
                ...prev,
                errorMessage: err.message || 'Check-in failed.'
              }
            : null
        );
      } finally {
        setIsProcessing(false);
      }
    } else {
      setState('approved');
    }
  };

  const handleUpdateSelections = async (newEventIds: string[]) => {
    const pId = resultData?.participantId || resultData?.participant?.id;
    if (!pId) return;
    const res = await attendanceService.updateEventSelections({
      participantId: pId,
      eventIds: newEventIds,
      coordinatorId: session?.id || null
    });
    if (res.success) {
      attendanceService.broadcastAttendanceChange();
      if (res.selectedEvents) {
        setResultData(prev =>
          prev
            ? {
                ...prev,
                selectedEvents: res.selectedEvents
              }
            : null
        );
      }
    }
  };

  if (!isAuthorized) {
    return (
      <AppShell>
        <main className="flex-1 p-6 flex flex-col items-center justify-center">
          <UnauthorizedState
            message="You do not have coordinator authorization to access this attendance scanner."
            targetSection={sectionName}
          />
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex-1 flex flex-col min-h-full">
        {/* Section Header */}
        <div className="bg-white border-b border-slate-200/80 px-4 py-3 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
              isOverall ? 'bg-emerald-600 shadow-emerald-600/20' : 'bg-blue-600 shadow-blue-600/20'
            } shadow-md`}>
              {isOverall ? <Building2 className="w-5 h-5" /> : <QrCode className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg text-slate-900 leading-tight">
                  {sectionName}
                </h1>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  isOverall ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  Live Gate
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Desk Coordinator: <strong className="text-slate-800">{session?.coordinatorCode}</strong> ({session?.name})
              </p>
            </div>
          </div>
        </div>

        {/* Scanner Content Area */}
        <main className="flex-1 max-w-lg w-full mx-auto p-4 sm:p-6 flex flex-col items-center justify-center">
          {/* Loading Spinner */}
          {state === 'loading' && (
            <div className="w-full max-w-md bg-white rounded-2xl p-8 text-center shadow-xl border border-slate-200 animate-fadeIn">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900">Verifying pass...</h3>
              <p className="text-xs text-slate-500 mt-1">
                Querying Supabase participant records
              </p>
            </div>
          )}

          {/* Valid Pass Card */}
          {state === 'valid' && resultData?.participant && (
            <ValidPassCard
              participant={resultData.participant}
              onConfirmCheckin={handleConfirmCheckin}
              onCancel={handleResetToScanner}
              isConfirming={isProcessing}
              sectionName={sectionName}
              isOverall={isOverall}
            />
          )}

          {/* Success State */}
          {state === 'approved' && resultData?.participant && (
            <SuccessState
              participantName={resultData.participant.name}
              passId={resultData.participant.passId || 'ENTRY-PASS'}
              entryTime={resultData.approvedTime}
              onNextScan={handleResetToScanner}
              autoReturnSeconds={2}
              sectionName={isOverall ? undefined : sectionName}
            />
          )}

          {/* Duplicate State */}
          {state === 'duplicate' && (
            <DuplicateState
              passId={resultData?.participant?.passId || 'ENTRY-PASS'}
              participantName={resultData?.participant?.name}
              participantId={resultData?.participantId}
              previousCheckin={resultData?.previousCheckin}
              selectedEvents={resultData?.selectedEvents}
              onScanAnother={handleResetToScanner}
              onUpdateSelections={handleUpdateSelections}
              canUpdateSelections={session?.role === 'ADMIN' || session?.role === 'OVERALL_COORDINATOR'}
            />
          )}

          {/* Invalid State */}
          {state === 'invalid' && (
            <InvalidState
              onTryAgain={handleResetToScanner}
              onOpenManualModal={() => setIsManualModalOpen(true)}
            />
          )}

          {/* Unauthorized State */}
          {state === 'unauthorized' && (
            <UnauthorizedState
              message={resultData?.errorMessage}
              targetSection={sectionName}
            />
          )}

          {/* Network Error */}
          {state === 'network_error' && (
            <ErrorState
              type="network"
              message={resultData?.errorMessage}
              onRetry={handleResetToScanner}
              onOpenManualModal={() => setIsManualModalOpen(true)}
            />
          )}

          {/* Camera Error */}
          {state === 'camera_error' && (
            <ErrorState
              type="camera"
              message={resultData?.errorMessage}
              onRetry={handleResetToScanner}
              onOpenManualModal={() => setIsManualModalOpen(true)}
            />
          )}

          {/* Camera Viewfinder (Idle & Scanning) */}
          {(state === 'idle' || state === 'scanning') && (
            <CameraViewfinder
              onScanToken={processToken}
              onOpenManualModal={() => setIsManualModalOpen(true)}
              isLocked={scanLockRef.current || isProcessing}
              onCameraError={(msg) => {
                soundController.playError();
                setState('camera_error');
                setResultData({
                  token: '',
                  attendanceType,
                  errorMessage: String(msg)
                });
              }}
            />
          )}
        </main>

        {/* Manual Token Entry Fallback Modal */}
        <ManualTokenModal
          isOpen={isManualModalOpen}
          onClose={() => setIsManualModalOpen(false)}
          onSubmitToken={processToken}
          isLoading={state === 'loading'}
        />
      </div>
    </AppShell>
  );
};
