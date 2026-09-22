import React, { useState, useRef, useEffect } from 'react';
import { FileSpreadsheet, FileText, Download, Printer, ChevronDown, Layers } from 'lucide-react';
import { ClassificationRow } from '../../types/attendance';
import { exportToExcel, exportToCSV, exportToPDF, printReport, ExportMetadata } from '../../utils/export';
import { VYUGAM_EVENTS } from '../../types/event';

interface ExportButtonMenuProps {
  rows: ClassificationRow[];
  filenamePrefix?: string;
  metadata?: ExportMetadata;
}

export const ExportButtonMenu: React.FC<ExportButtonMenuProps> = ({
  rows,
  filenamePrefix = 'vyugam_attendance',
  metadata
}) => {
  const [isEventMenuOpen, setIsEventMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsEventMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExcel = () => {
    exportToExcel(rows, `${filenamePrefix}.xlsx`, metadata);
  };

  const handleCSV = () => {
    exportToCSV(rows, `${filenamePrefix}.csv`, metadata);
  };

  const handlePDF = () => {
    exportToPDF(rows, `${filenamePrefix}.pdf`, metadata);
  };

  const handlePrint = () => {
    printReport();
  };

  const handleExportSpecificEvent = (eventSlug: string, eventName: string) => {
    setIsEventMenuOpen(false);
    exportToExcel(rows, `${filenamePrefix}_${eventSlug}.xlsx`, {
      ...metadata,
      eventSlug,
      eventName,
      title: `${eventName.toUpperCase()} ATTENDANCE REPORT`,
      subtitle: `VYUGAM 2.0 Official Event Attendance (Filtered from Overall Gate)`
    });
  };

  const isDisabled = rows.length === 0;
  const isOverall = metadata?.scope === 'OVERALL' || (!metadata?.scope && !metadata?.eventSlug);

  return (
    <div className="flex flex-wrap items-center gap-2 relative">
      {/* Primary Multi-Sheet Export Excel (.xlsx) */}
      <button
        onClick={handleExcel}
        disabled={isDisabled}
        className="touch-target px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
        title={isOverall ? 'Export All Events Multi-Sheet Excel (.xlsx)' : 'Export to Excel (.xlsx)'}
      >
        <FileSpreadsheet className="w-4 h-4" />
        <span>{isOverall ? 'Export Multi-Sheet Excel' : 'Export Excel'}</span>
      </button>

      {/* Event-Wise Dedicated Export Dropdown for Overall Dashboard */}
      {isOverall && (
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsEventMenuOpen(!isEventMenuOpen)}
            disabled={isDisabled}
            className="touch-target px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
            title="Download individual event sheets"
          >
            <Layers className="w-4 h-4" />
            <span>Event-Wise Sheets</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {isEventMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 animate-fadeIn">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                Download Specific Event
              </div>
              <button
                onClick={handleExcel}
                className="w-full text-left px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 flex items-center justify-between"
              >
                <span>All Events (Multi-Sheet .xlsx)</span>
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                  All Tabs
                </span>
              </button>
              <div className="my-1 border-t border-slate-100" />
              {VYUGAM_EVENTS.filter(e => e.status === 'ACTIVE').map(ev => {
                const count = rows.filter(r => {
                  if (ev.code === 'CODE_CRUSADE') return r.codeCrusadeSelected === 'YES';
                  if (ev.code === 'LOGIC_ARENA') return r.logicArenaSelected === 'YES';
                  if (ev.code === 'UIUX_STUDIO') return r.uiuxStudioSelected === 'YES';
                  if (ev.code === 'TECH_TACTICS') return r.techTacticsSelected === 'YES';
                  if (ev.code === 'PIXEL_PULSE') return r.pixelPulseSelected === 'YES';
                  return false;
                }).length;

                return (
                  <button
                    key={ev.id}
                    onClick={() => handleExportSpecificEvent(ev.slug, ev.name)}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span>{ev.name}</span>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {count} selected
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Export CSV */}
      <button
        onClick={handleCSV}
        disabled={isDisabled}
        className="touch-target px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
        title="Export as CSV"
      >
        <Download className="w-4 h-4" />
        <span>CSV</span>
      </button>

      {/* Download PDF */}
      <button
        onClick={handlePDF}
        disabled={isDisabled}
        className="touch-target px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
        title="Download Print-Ready PDF"
      >
        <FileText className="w-4 h-4" />
        <span>PDF</span>
      </button>

      {/* Print */}
      <button
        onClick={handlePrint}
        disabled={isDisabled}
        className="touch-target px-3 py-2 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
        title="Print Report"
      >
        <Printer className="w-4 h-4 text-slate-600" />
        <span>Print</span>
      </button>
    </div>
  );
};
