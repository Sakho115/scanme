import React from 'react';
import { XCircle, RefreshCw, Keyboard } from 'lucide-react';

interface InvalidStateProps {
  onTryAgain: () => void;
  onOpenManualModal: () => void;
}

export const InvalidState: React.FC<InvalidStateProps> = ({
  onTryAgain,
  onOpenManualModal,
}) => {
  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border-2 border-rose-500 overflow-hidden text-center animate-fadeIn">
      {/* Top Rose Header */}
      <div className="bg-rose-600 px-6 py-8 text-white flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center mb-3">
          <XCircle className="w-12 h-12 text-white stroke-[2.5]" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-wider uppercase">
          ✕ INVALID PASS
        </h2>
        <p className="text-rose-100 text-xs font-semibold tracking-wide mt-1">
          Unrecognized or unauthorized QR code
        </p>
      </div>

      {/* Body */}
      <div className="p-6 space-y-4">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-rose-900 leading-relaxed">
            This QR code is not registered for this event.
          </p>
          <p className="text-xs text-rose-700/80 mt-1">
            Please ask the participant to show their official VYUGAM 2026 entry pass.
          </p>
        </div>

        <div className="pt-2 space-y-2.5">
          <button
            onClick={onTryAgain}
            className="touch-target w-full py-3.5 bg-rose-600 hover:bg-rose-500 active:scale-98 text-white font-bold text-sm rounded-xl shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>TRY AGAIN</span>
          </button>

          <button
            onClick={onOpenManualModal}
            className="touch-target w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            <Keyboard className="w-3.5 h-3.5 text-blue-600" />
            <span>Enter Pass Token Manually</span>
          </button>
        </div>
      </div>
    </div>
  );
};
