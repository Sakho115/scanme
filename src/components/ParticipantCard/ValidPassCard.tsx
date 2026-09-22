import React, { useState } from 'react';
import { CheckCircle, School, BookOpen, Calendar, ArrowLeft, Loader2, Tag, CheckSquare } from 'lucide-react';
import { ParticipantPassInfo } from '../../types/participant';
import { VyugamEvent, VYUGAM_EVENTS } from '../../types/event';

interface ValidPassCardProps {
  participant: ParticipantPassInfo;
  onConfirmCheckin: (selectedEventIds: string[]) => void;
  onCancel: () => void;
  isConfirming: boolean;
  sectionName?: string;
  isOverall?: boolean;
  events?: VyugamEvent[];
}

export const ValidPassCard: React.FC<ValidPassCardProps> = ({
  participant,
  onConfirmCheckin,
  onCancel,
  isConfirming,
  sectionName,
  isOverall = false,
  events = VYUGAM_EVENTS
}) => {
  const activeEvents = events.filter(e => e.status === 'ACTIVE');
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);

  const handleToggleEvent = (id: string) => {
    setSelectedEventIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    onConfirmCheckin(selectedEventIds);
  };

  return (
    <div className="w-full max-w-sm sm:max-w-md bg-white rounded-2xl shadow-xl border-2 border-emerald-500/40 overflow-hidden animate-fadeIn">
      {/* Top Valid Badge Header */}
      <div className="bg-emerald-600 text-white px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[2.5]" />
          <span className="font-extrabold tracking-wider text-xs uppercase">
            Valid Entry Pass
          </span>
        </div>
        <span className="text-emerald-100 font-mono text-xs font-semibold px-2 py-0.5 bg-emerald-700/60 rounded">
          {participant.passId}
        </span>
      </div>

      {/* Target Section Banner */}
      {sectionName && (
        <div className="bg-emerald-50 px-4 py-1.5 sm:px-5 sm:py-2 border-b border-emerald-100 flex items-center gap-1.5 text-[11px] sm:text-xs text-emerald-800 font-bold">
          <Tag className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          <span className="truncate">Section: {sectionName}</span>
        </div>
      )}

      {/* Participant Core Details */}
      <div className="p-4 sm:p-6 space-y-3.5 sm:space-y-4">
        {/* Name */}
        <div>
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Participant Name
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 capitalize tracking-tight mt-0.5 leading-snug">
            {participant.name}
          </h2>
        </div>

        {/* Institution / College */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
          <div className="flex items-start gap-2.5">
            <School className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                College / Institution
              </span>
              <p className="text-xs sm:text-sm font-bold text-slate-800 leading-snug line-clamp-2">
                {participant.college}
              </p>
            </div>
          </div>
        </div>

        {/* Department & Year Grid */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          <div className="bg-slate-50 rounded-xl p-2.5 sm:p-3 border border-slate-200/80">
            <div className="flex items-center gap-1.5 mb-0.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Department
              </span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
              {participant.department}
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-2.5 sm:p-3 border border-slate-200/80">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Year
              </span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-800">
              {participant.year}
            </p>
          </div>
        </div>

        {/* Pass ID Banner */}
        <div className="flex items-center justify-between py-1.5 px-3 bg-blue-50/70 border border-blue-100 rounded-xl">
          <span className="text-[11px] font-semibold text-blue-900">Pass ID</span>
          <span className="font-mono font-bold text-xs sm:text-sm text-blue-700 tracking-wide">
            {participant.passId}
          </span>
        </div>

        {/* Event Participation Section (Overall Gate Only) */}
        {isOverall && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 sm:p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                  <h3 className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-900">
                    Event Participation
                  </h3>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-500">
                  Select events attendee plans to join
                </p>
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 whitespace-nowrap">
                {selectedEventIds.length} Selected
              </span>
            </div>

            <div className="space-y-1.5 pt-0.5">
              {activeEvents.map(event => {
                const isChecked = selectedEventIds.includes(event.id);
                return (
                  <label
                    key={event.id}
                    className={`flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer select-none touch-target ${
                      isChecked
                        ? 'bg-blue-50/90 border-blue-400 text-blue-950 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleEvent(event.id)}
                      className="w-4 h-4 sm:w-5 sm:h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                    />
                    <span className="font-bold text-xs sm:text-sm flex-1 truncate">{event.name}</span>
                    {isChecked && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded flex-shrink-0">
                        Selected
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 space-y-2.5">
          {/* Primary Check-In Button */}
          <button
            onClick={handleConfirm}
            disabled={isConfirming}
            className="touch-target w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-extrabold text-base tracking-wider rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2.5 transition-all disabled:opacity-75"
          >
            {isConfirming ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Recording Entry...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>{isOverall ? 'Confirm Entry' : 'CHECK IN'}</span>
              </>
            )}
          </button>

          {/* Cancel Button */}
          <button
            onClick={onCancel}
            disabled={isConfirming}
            className="touch-target w-full py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Cancel / Scan Another
          </button>
        </div>
      </div>
    </div>
  );
};
