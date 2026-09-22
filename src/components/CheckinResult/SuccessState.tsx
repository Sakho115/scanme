import React, { useEffect, useState } from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatTimeWithSeconds } from '../../utils/formatting';

interface SuccessStateProps {
  participantName: string;
  passId: string;
  entryTime?: string;
  onNextScan: () => void;
  autoReturnSeconds?: number;
  sectionName?: string;
}

export const SuccessState: React.FC<SuccessStateProps> = ({
  participantName,
  passId,
  entryTime,
  onNextScan,
  autoReturnSeconds = 2,
  sectionName
}) => {
  const [countdown, setCountdown] = useState(autoReturnSeconds);

  // Trigger brief confetti burst on mount
  useEffect(() => {
    try {
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#059669']
      });
    } catch {
      // ignore
    }
  }, []);

  // 2-second automatic return countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onNextScan();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onNextScan]);

  const displayTime = entryTime
    ? formatTimeWithSeconds(entryTime)
    : formatTimeWithSeconds(new Date().toISOString());

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border-2 border-emerald-500 overflow-hidden text-center animate-fadeIn">
      {/* Top Emerald Header */}
      <div className="bg-emerald-600 px-6 py-8 text-white flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center mb-3 animate-bounce">
          <CheckCircle2 className="w-12 h-12 text-white stroke-[2.5]" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-wider uppercase">
          {sectionName ? '✓ EVENT ENTRY RECORDED' : '✓ ENTRY RECORDED'}
        </h2>
        {sectionName && (
          <div className="mt-1 px-3 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold uppercase tracking-wider">
            {sectionName}
          </div>
        )}
      </div>

      {/* Body Details */}
      <div className="p-6 space-y-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Welcome Attendee
          </span>
          <h3 className="text-2xl font-black text-slate-900 capitalize mt-0.5">
            {participantName}
          </h3>
        </div>

        <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-3.5 flex items-center justify-between">
          <div className="text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
              Pass ID
            </span>
            <span className="font-mono font-black text-base text-emerald-950">
              {passId}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
              Entry Recorded At
            </span>
            <span className="font-mono font-bold text-sm text-emerald-900">
              {displayTime}
            </span>
          </div>
        </div>

        {/* Countdown & Quick Action */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <button
            onClick={onNextScan}
            className="touch-target w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <span>Scan Next Participant</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-xs text-slate-400 font-medium">
            Returning to camera in <strong className="text-emerald-600 font-bold">{countdown}s</strong>...
          </p>
        </div>
      </div>
    </div>
  );
};
