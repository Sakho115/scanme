import React, { useState } from 'react';
import { AppShell } from '../components/Navigation/AppShell';
import { soundController } from '../utils/audio';
import { attendanceService } from '../services/attendanceService';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  Volume2,
  VolumeX,
  Smartphone,
  RotateCcw,
  Database,
  Check,
  Trash2,
  AlertTriangle,
  ShieldCheck,
  Loader2,
  X
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [soundEnabled, setSoundEnabled] = useState(soundController.soundEnabled);
  const [hapticEnabled, setHapticEnabled] = useState(soundController.hapticEnabled);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [isResettingScanData, setIsResettingScanData] = useState(false);
  const [resetScanSuccess, setResetScanSuccess] = useState(false);
  const supabaseActive = isSupabaseConfigured();

  const handleToggleSound = () => {
    const next = !soundEnabled;
    soundController.soundEnabled = next;
    setSoundEnabled(next);
    if (next) soundController.playSuccess();
  };

  const handleToggleHaptic = () => {
    const next = !hapticEnabled;
    soundController.hapticEnabled = next;
    setHapticEnabled(next);
    if (next) soundController.triggerHaptic(50);
  };

  const handleResetData = async () => {
    setIsResettingScanData(true);
    try {
      await attendanceService.resetScanData();
      setResetSuccess(true);
      soundController.playSuccess();
      setTimeout(() => setResetSuccess(false), 2500);
    } catch (err: any) {
      alert(`Error resetting data: ${err.message}`);
    } finally {
      setIsResettingScanData(false);
    }
  };

  const handleConfirmResetScanData = async () => {
    setIsResettingScanData(true);
    try {
      const res = await attendanceService.resetScanData();
      if (res.success) {
        soundController.playSuccess();
        setResetScanSuccess(true);
        setShowResetConfirmModal(false);
        setTimeout(() => setResetScanSuccess(false), 3500);
      } else {
        alert(`Reset failed: ${res.error || 'Unknown error'}`);
      }
    } catch (e: any) {
      alert(`Error resetting scan data: ${e.message}`);
    } finally {
      setIsResettingScanData(false);
    }
  };

  return (
    <AppShell>
      <div className="flex-1 p-4 sm:p-6 max-w-2xl w-full mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200">
          <h2 className="text-xl font-black text-slate-900 mb-1">System Settings</h2>
          <p className="text-xs text-slate-500">
            Configure local device preferences, manage scan records, and monitor database connection.
          </p>

          <div className="space-y-3.5 mt-5">
            {/* Audio Toggle */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Audio Chimes</h4>
                  <p className="text-xs text-slate-500">Synthesized audio feedback on QR scan</p>
                </div>
              </div>
              <button
                onClick={handleToggleSound}
                className={`touch-target px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                  soundEnabled ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {soundEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            {/* Haptic Vibration Toggle */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Haptic Vibration</h4>
                  <p className="text-xs text-slate-500">Vibrate mobile device on scan verification</p>
                </div>
              </div>
              <button
                onClick={handleToggleHaptic}
                className={`touch-target px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                  hapticEnabled ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {hapticEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            {/* Reset Demo Attendance (Mock Only) */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Reset Demo Attendance</h4>
                  <p className="text-xs text-slate-500">Reset local store to initial test records</p>
                </div>
              </div>
              <button
                onClick={handleResetData}
                className="touch-target px-3.5 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
              >
                {resetSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Reset!</span>
                  </>
                ) : (
                  <span>Reset Demo</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Dedicated Scan Database Reset Card (Safe: Keeps Participants Intact) */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border-2 border-rose-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Reset Scan Database
                </h3>
                <p className="text-xs text-slate-500">
                  Erase scanned check-ins and gate event selections only
                </p>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-200 text-xs text-slate-700 space-y-2">
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <p className="font-medium">
                <strong className="text-slate-900">Safe for Master Data:</strong> This button resets only the scanned attendance check-ins and event selections. It does <strong>NOT</strong> touch or delete your registered participants (all 173 participants remain intact in the database).
              </p>
            </div>
          </div>

          {resetScanSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-bold animate-fadeIn">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Scanned attendance database has been successfully reset to 0! All 173 participants preserved.</span>
            </div>
          )}

          <button
            onClick={() => setShowResetConfirmModal(true)}
            className="touch-target w-full py-3 bg-rose-600 hover:bg-rose-500 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span>Reset Scanned Attendance Data</span>
          </button>
        </div>

        {/* Confirmation Modal */}
        {showResetConfirmModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Confirm Scan Database Reset
                  </h3>
                </div>
                <button
                  onClick={() => setShowResetConfirmModal(false)}
                  disabled={isResettingScanData}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                <p>
                  Are you sure you want to reset the scanned database?
                </p>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 font-medium">
                  <div className="text-rose-700 flex items-center gap-1.5">
                    <span>✕ All recorded gate check-ins will be cleared</span>
                  </div>
                  <div className="text-rose-700 flex items-center gap-1.5">
                    <span>✕ All recorded event check-ins will be cleared</span>
                  </div>
                  <div className="text-rose-700 flex items-center gap-1.5">
                    <span>✕ Gate event selections will be cleared</span>
                  </div>
                  <div className="text-emerald-700 flex items-center gap-1.5 font-bold pt-1 border-t border-slate-200">
                    <span>✓ All 173 registered participants remain 100% SAFE</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setShowResetConfirmModal(false)}
                  disabled={isResettingScanData}
                  className="touch-target flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmResetScanData}
                  disabled={isResettingScanData}
                  className="touch-target flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-600/30 flex items-center justify-center gap-1.5 transition-all disabled:opacity-75"
                >
                  {isResettingScanData ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Resetting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Yes, Reset Scans</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Supabase Connection Status Card */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Database className="w-5 h-5 text-blue-600" />
              <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider">
                Database Engine
              </h3>
            </div>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                supabaseActive
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${supabaseActive ? 'bg-emerald-500' : 'bg-blue-500 animate-pulse'}`} />
              {supabaseActive ? 'Supabase Connected' : 'Isomorphic Mock Store Active'}
            </span>
          </div>

          <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="font-bold text-slate-900 block mb-0.5">
                PostgreSQL Schema Status:
              </span>
              <p className="text-slate-500">
                Migration file ready at <code>supabase/migrations/20260920000000_init_schema.sql</code> with unique indexes:
                <br />
                <code className="text-blue-700 font-bold">idx_attendance_unique_overall</code> (1 venue entry) &amp;
                <code className="text-blue-700 font-bold"> idx_attendance_unique_event</code> (1 entry per event).
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="font-bold text-slate-900 block mb-0.5">
                Atomic RPC Function:
              </span>
              <p className="text-slate-500">
                <code>verify_and_checkin</code> handles validation, role authorization, duplicate checks, and attendance recording atomically.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="font-bold text-slate-900 block mb-0.5">
                Environment Variables:
              </span>
              <p className="text-slate-500">
                Configure <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> on Vercel to activate live Supabase PostgreSQL.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};
