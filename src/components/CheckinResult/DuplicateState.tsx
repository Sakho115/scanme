import React, { useState } from 'react';
import { AlertCircle, Clock, ShieldAlert, ArrowRight, Edit3, Save, Loader2 } from 'lucide-react';
import { PreviousCheckinInfo, SelectedEventInfo } from '../../types/attendance';
import { formatTime } from '../../utils/formatting';
import { VYUGAM_EVENTS } from '../../types/event';

interface DuplicateStateProps {
  passId: string;
  participantName?: string;
  participantId?: string;
  previousCheckin?: PreviousCheckinInfo;
  selectedEvents?: SelectedEventInfo[];
  onScanAnother: () => void;
  onUpdateSelections?: (newEventIds: string[]) => Promise<void>;
  canUpdateSelections?: boolean;
}

export const DuplicateState: React.FC<DuplicateStateProps> = ({
  passId,
  participantName,
  previousCheckin,
  selectedEvents = [],
  onScanAnother,
  onUpdateSelections,
  canUpdateSelections = false
}) => {
  const formattedTime = previousCheckin?.time ? formatTime(previousCheckin.time) : 'Earlier today';
  const coordinator = previousCheckin?.coordinatorName || previousCheckin?.coordinatorId || 'Desk Coordinator';

  const getInitialIds = (events: SelectedEventInfo[]) => {
    return VYUGAM_EVENTS
      .filter(e => events.some(s => s.id === e.id || s.code === e.code))
      .map(e => e.id);
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editingIds, setEditingIds] = useState<string[]>(() =>
    getInitialIds(selectedEvents)
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSelections = async () => {
    if (!onUpdateSelections) return;
    setIsSaving(true);
    try {
      await onUpdateSelections(editingIds);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update selections:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border-2 border-amber-500 overflow-hidden text-center animate-fadeIn">
      {/* Top Amber Warning Banner */}
      <div className="bg-amber-500 px-6 py-8 text-white flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center mb-3">
          <AlertCircle className="w-12 h-12 text-white stroke-[2.5]" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-wider uppercase">
          ⚠ ALREADY CHECKED IN
        </h2>
        <p className="text-amber-100 text-xs font-semibold tracking-wide mt-1">
          This pass has already been used for entry.
        </p>
      </div>

      {/* Warning Info Details */}
      <div className="p-6 space-y-4">
        {participantName && (
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Registered Attendee
            </span>
            <h3 className="text-xl font-extrabold text-slate-800 capitalize mt-0.5">
              {participantName}
            </h3>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200/90 rounded-xl p-4 text-left space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-amber-200/60">
            <span className="text-xs font-bold text-amber-900">Pass ID</span>
            <span className="font-mono font-black text-sm text-amber-950">
              {passId}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-800 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              Checked In:
            </span>
            <span className="font-mono font-bold text-sm text-slate-900">
              {formattedTime}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-800 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              Coordinator:
            </span>
            <span className="font-bold text-xs bg-amber-200/60 text-amber-900 px-2 py-0.5 rounded">
              {coordinator}
            </span>
          </div>
        </div>

        {/* Event Participation Display / Update */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 text-left space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-950 uppercase tracking-wider">
              Event Participation
            </span>
            {canUpdateSelections && !isEditing && (
              <button
                onClick={() => {
                  setEditingIds(getInitialIds(selectedEvents));
                  setIsEditing(true);
                }}
                className="text-[11px] font-bold text-blue-700 hover:text-blue-900 underline flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" />
                Update Event Selection
              </button>
            )}
          </div>

          {!isEditing ? (
            <div className="space-y-1.5 pt-1">
              {VYUGAM_EVENTS.filter(e => e.status === 'ACTIVE').map(event => {
                const isSelected = selectedEvents.some(s => s.id === event.id || s.code === event.code);
                return (
                  <div
                    key={event.id}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold ${
                      isSelected ? 'bg-amber-100/90 text-amber-950 font-bold border border-amber-300/60' : 'text-slate-400 bg-white/70'
                    }`}
                  >
                    <span>{event.name}</span>
                    <span className="font-mono text-[11px]">{isSelected ? '☑ Selected' : '☐ Not Selected'}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              {VYUGAM_EVENTS.filter(e => e.status === 'ACTIVE').map(event => {
                const isChecked = editingIds.includes(event.id);
                return (
                  <label
                    key={event.id}
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs font-bold cursor-pointer select-none ${
                      isChecked
                        ? 'bg-blue-50 border-blue-300 text-blue-950'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        setEditingIds(prev =>
                          prev.includes(event.id) ? prev.filter(id => id !== event.id) : [...prev, event.id]
                        );
                      }}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="flex-1">{event.name}</span>
                  </label>
                );
              })}

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={handleSaveSelections}
                  disabled={isSaving}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Changes</span>
                </button>
                <button
                  onClick={() => {
                    setEditingIds(getInitialIds(selectedEvents));
                    setIsEditing(false);
                  }}
                  disabled={isSaving}
                  className="px-3 py-2 text-slate-600 hover:text-slate-900 text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-slate-500 italic">
          Pass re-use is restricted to prevent duplicate entries at event gates.
        </p>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={onScanAnother}
            className="touch-target w-full py-3.5 bg-amber-600 hover:bg-amber-500 active:scale-98 text-white font-bold text-sm rounded-xl shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 transition-all"
          >
            <span>SCAN ANOTHER PASS</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
