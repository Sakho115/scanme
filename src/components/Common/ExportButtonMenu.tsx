import React from 'react';
import { FileSpreadsheet, FileText, Download, Printer } from 'lucide-react';
import { ClassificationRow } from '../../types/attendance';
import { exportToExcel, exportToCSV, exportToPDF, printReport, ExportMetadata } from '../../utils/export';

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

  const isDisabled = rows.length === 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Export Excel (.xlsx) */}
      <button
        onClick={handleExcel}
        disabled={isDisabled}
        className="touch-target px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
        title="Export to Excel Spreadsheet (.xlsx)"
      >
        <FileSpreadsheet className="w-4 h-4" />
        <span>Export Excel</span>
      </button>

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
