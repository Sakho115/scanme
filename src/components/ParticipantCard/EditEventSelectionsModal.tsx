import React, { useState, useEffect } from 'react';
import { X, CheckSquare, Save, Loader2, User, School, Sparkles } from 'lucide-react';
import { VYUGAM_EVENTS, VyugamEvent } from '../../types/event';

interface EditEventSelectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant: {
    id?: string;
    passId: string;
    name: string;
    college: string;
    department?: string;
    year?: string;
  };
  currentSelectedEvents: {
    codeCrusade?: boolean;
    logicArena?: boolean;
    uiuxStudio?: boolean;
    techTactics?: boolean;
    pixelPulse?: boolean;
  };
  onSave: (selectedEventIds: string[]) => Promise<void>;
}

export const EditEventSelectionsModal: React.FC<EditEventSelectionsModalProps> = ({
  isOpen,
  onClose,
  participant,
  currentSelectedEvents,
  onSave
}) => {
  const activeEvents = VYUGAM_EVENTS.filter(e => e.status === 'ACTIVE');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize selected event IDs from current selections
  useEffect(() => {
    if (isOpen) {
      const initialIds: string[] = [];
      const evCC = activeEvents.find(e => e.code === 'CODE_CRUSADE');
      const evLA = activeEvents.find(e => e.code === 'LOGIC_ARENA');
      const evUI = activeEvents.find(e => e.code === 'UIUX_STUDIO');
      const evTT = activeEvents.find(e => e.code === 'TECH_TACTICS');
      const evPP = activeEvents.find(e => e.code === 'PIXEL_PULSE');

      if (currentSelectedEvents.codeCrusade && evCC) initialIds.push(evCC.id);
      if (currentSelectedEvents.logicArena && evLA) initialIds.push(evLA.id);
      if (currentSelectedEvents.uiuxStudio && evUI) initialIds.push(evUI.id);
      if (currentSelectedEvents.techTactics && evTT) initialIds.push(evTT.id);
      if (currentSelectedEvents.pixelPulse && evPP) initialIds.push(evPP.id);

      setSelectedIds(initialIds);
      setErrorMsg(null);
    }
  }, [isOpen, currentSelectedEvents]);

  if (!isOpen) return null;

  const handleToggle = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMsg(null);
    try {
      await onSave(selectedIds);
      onClose();
    } catch (err: any) {
      console.error('Failed to update event selections:', err);
      setErrorMsg(err.message || 'Failed to update event selections. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white leading-tight">
                Edit Event Selections
              </h3>
              <p className="text-[11px] text-slate-400">
                Update participating events for attendee
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Attendee Info Card */}
        <div className="p-5 space-y-4">
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {participant.passId}
              </span>
              <span className="text-[11px] text-slate-500 font-semibold">
                {participant.year} {participant.department ? `• ${participant.department}` : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <h4 className="font-black text-base text-slate-900 capitalize leading-snug">
                {participant.name}
              </h4>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <School className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">{participant.college}</span>
            </div>
          </div>

          {/* Event Checkboxes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                Select Decided Events
              </span>
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                {selectedIds.length} Selected
              </span>
            </div>

            <div className="space-y-2 pt-1">
              {activeEvents.map(ev => {
                const isChecked = selectedIds.includes(ev.id);
                return (
                  <label
                    key={ev.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-bold cursor-pointer select-none transition-all ${
                      isChecked
                        ? 'bg-blue-50/90 border-blue-300 text-blue-950 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggle(ev.id)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-900">{ev.name}</span>
                        <span className="text-[10px] font-mono text-slate-500 uppercase">{ev.code}</span>
                      </div>
                      <p className="text-[11px] font-normal text-slate-500 truncate mt-0.5">
                        {ev.description}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 active:scale-98 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isSaving ? 'Saving Changes...' : 'Save Selected Events'}</span>
            </button>
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
