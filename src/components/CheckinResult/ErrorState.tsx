import React from 'react';
import { WifiOff, AlertTriangle, RefreshCw, Keyboard } from 'lucide-react';

interface ErrorStateProps {
  type: 'network' | 'camera';
  message?: string;
  onRetry: () => void;
  onOpenManualModal?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  type,
  message,
  onRetry,
  onOpenManualModal,
}) => {
  const isNetwork = type === 'network';

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border-2 border-slate-300 overflow-hidden text-center animate-fadeIn">
      {/* Header */}
      <div className="bg-slate-800 px-6 py-8 text-white flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm border-2 border-white/20 flex items-center justify-center mb-3">
          {isNetwork ? (
            <WifiOff className="w-10 h-10 text-rose-400" />
          ) : (
            <AlertTriangle className="w-10 h-10 text-amber-400" />
          )}
        </div>
        <h2 className="text-2xl font-black tracking-wide">
          {isNetwork ? 'Connection Problem' : 'Camera Unavailable'}
        </h2>
        <p className="text-slate-300 text-xs font-semibold mt-1">
          {isNetwork
            ? "We couldn't verify this pass right now."
            : 'Unable to initialize device video stream.'}
        </p>
      </div>

      {/* Body */}
      <div className="p-6 space-y-4">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 leading-relaxed">
          {message ||
            (isNetwork
              ? 'Please check your desk network connection and retry the verification request.'
              : 'Please ensure camera permissions are allowed in your browser settings.')}
        </div>

        <div className="pt-2 space-y-2.5">
          <button
            onClick={onRetry}
            className="touch-target w-full py-3.5 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>TRY AGAIN</span>
          </button>

          {onOpenManualModal && (
            <button
              onClick={onOpenManualModal}
              className="touch-target w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <Keyboard className="w-3.5 h-3.5 text-blue-600" />
              <span>Enter Pass Token Manually</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
