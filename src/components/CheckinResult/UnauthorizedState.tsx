import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';

interface UnauthorizedStateProps {
  message?: string;
  targetSection?: string;
}

export const UnauthorizedState: React.FC<UnauthorizedStateProps> = ({
  message,
  targetSection
}) => {
  const navigate = useNavigate();
  const session = authService.getSession();

  const handleReturn = () => {
    if (session?.assignedEventSlug) {
      navigate(`/attendance/event/${session.assignedEventSlug}`);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border-2 border-rose-500 overflow-hidden text-center animate-fadeIn">
      {/* Header */}
      <div className="bg-rose-600 px-6 py-8 text-white flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center mb-3">
          <ShieldAlert className="w-12 h-12 text-white stroke-[2.5]" />
        </div>
        <h2 className="text-2xl font-black tracking-wider uppercase">
          ⛔ ACCESS RESTRICTED
        </h2>
        <p className="text-rose-100 text-xs font-semibold tracking-wide mt-1">
          Unauthorized Section / Event
        </p>
      </div>

      {/* Body */}
      <div className="p-6 space-y-4">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-left space-y-2">
          <p className="text-xs font-bold text-rose-900">
            {message || 'You are not authorized to record attendance for this event.'}
          </p>
          {targetSection && (
            <p className="text-[11px] text-rose-700">
              Attempted Section: <strong className="font-semibold">{targetSection}</strong>
            </p>
          )}
          {session?.assignedEventName && (
            <p className="text-[11px] text-slate-600 pt-1 border-t border-rose-200/60">
              Your Assigned Event: <strong className="text-blue-700 font-bold">{session.assignedEventName}</strong>
            </p>
          )}
        </div>

        <button
          onClick={handleReturn}
          className="touch-target w-full py-3.5 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>
            {session?.assignedEventName ? `Go to ${session.assignedEventName}` : 'Return to Dashboard'}
          </span>
        </button>
      </div>
    </div>
  );
};
