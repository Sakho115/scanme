import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { AppShell } from '../components/Navigation/AppShell';
import { FilterToolbar } from '../components/Common/FilterToolbar';
import { ExportButtonMenu } from '../components/Common/ExportButtonMenu';
import { attendanceService } from '../services/attendanceService';
import {
  ClassificationFilters,
  ClassificationRow,
  CollegeBreakdownRow,
  DepartmentBreakdownRow
} from '../types/attendance';
import { VYUGAM_EVENTS } from '../types/event';
import { exportToExcel } from '../utils/export';
import {
  FileSpreadsheet,
  Building2,
  BookOpen,
  RefreshCw,
  Search,
  Layers
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'classification' | 'colleges' | 'departments'>('classification');
  const [filters, setFilters] = useState<ClassificationFilters>({
    status: 'ALL'
  });
  const [rows, setRows] = useState<ClassificationRow[]>([]);
  const [collegeRows, setCollegeRows] = useState<CollegeBreakdownRow[]>([]);
  const [deptRows, setDeptRows] = useState<DepartmentBreakdownRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const filterOptions = useMemo(() => {
    return attendanceService.getFilterOptions();
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [r, c, d] = await Promise.all([
        attendanceService.getClassificationRows(filters),
        attendanceService.getCollegeBreakdown(),
        attendanceService.getDepartmentBreakdown()
      ]);
      setRows(r);
      setCollegeRows(c);
      setDeptRows(d);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const exportMetadata = {
    title: filters.eventSlug
      ? `${filters.eventSlug.toUpperCase().replace(/-/g, ' ')} ATTENDANCE REPORT`
      : 'GLOBAL ATTENDANCE CLASSIFICATION REPORT',
    subtitle: 'VYUGAM 2.0 Entry Log',
    scope: (filters.eventSlug ? 'EVENT' : 'OVERALL') as 'EVENT' | 'OVERALL',
    eventSlug: filters.eventSlug,
    filters: {
      College: filters.college,
      Department: filters.department,
      Year: filters.year,
      Status: filters.status,
      Section: filters.eventSlug || filters.attendanceType || 'All'
    }
  };

  const handleExportCollegeReport = () => {
    // Convert college breakdown to classification rows for export
    const exportRows: ClassificationRow[] = collegeRows.map((c, i) => ({
      index: i + 1,
      passId: `COL-${String(i + 1).padStart(3, '0')}`,
      name: c.college,
      college: c.college,
      department: 'All Departments',
      year: 'All Years',
      checkinTime: '',
      formattedTime: `${c.overallAttendance} / ${c.totalParticipants}`,
      coordinatorName: `Code:${c.codeCrusade} Log:${c.logicArena} UI:${c.uiuxStudio} Tech:${c.techTactics} Pix:${c.pixelPulse}`,
      status: `${((c.overallAttendance / (c.totalParticipants || 1)) * 100).toFixed(1)}%`
    }));

    exportToExcel(exportRows, 'college_wise_attendance_report.xlsx', {
      title: 'COLLEGE-WISE ATTENDANCE BREAKDOWN',
      subtitle: 'VYUGAM 2.0 Institution Participation Matrix'
    });
  };

  return (
    <AppShell>
      <div className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 shadow-md shadow-blue-600/20 text-white flex items-center justify-center flex-shrink-0 font-bold">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Reports & Classification Center
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Multi-dimensional attendee classification, college breakdowns, and print exports
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={loadData}
              disabled={isLoading}
              className="touch-target p-2.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* View Selection Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('classification')}
            className={`touch-target px-4 py-2 rounded-xl transition-colors flex items-center gap-2 ${
              activeTab === 'classification'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Multi-Dimensional Filter</span>
          </button>

          <button
            onClick={() => setActiveTab('colleges')}
            className={`touch-target px-4 py-2 rounded-xl transition-colors flex items-center gap-2 ${
              activeTab === 'colleges'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>College-Wise Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab('departments')}
            className={`touch-target px-4 py-2 rounded-xl transition-colors flex items-center gap-2 ${
              activeTab === 'departments'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Department-Wise Matrix</span>
          </button>
        </div>

        {/* TAB 1: MULTI-DIMENSIONAL CLASSIFICATION */}
        {activeTab === 'classification' && (
          <div className="space-y-4">
            {/* Filter Toolbar */}
            <div className="space-y-3">
              <FilterToolbar
                filters={filters}
                onChange={setFilters}
                options={filterOptions}
                showStatusFilter={true}
              />

              {/* Event / Section Selector */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mr-1">
                  Section Filter:
                </span>
                <button
                  onClick={() => setFilters({ ...filters, eventSlug: undefined, attendanceType: undefined })}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                    !filters.eventSlug && !filters.attendanceType
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  All Sections
                </button>
                <button
                  onClick={() => setFilters({ ...filters, eventSlug: undefined, attendanceType: 'OVERALL' })}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                    filters.attendanceType === 'OVERALL'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Overall Gate
                </button>
                {VYUGAM_EVENTS.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => setFilters({ ...filters, eventSlug: ev.slug, attendanceType: 'EVENT' })}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                      filters.eventSlug === ev.slug
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {ev.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-slate-900">
                      Classified Attendees Log
                    </h3>
                    <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                      {rows.length} matched
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Ready for Excel, CSV, PDF download or direct printing
                  </p>
                </div>

                <ExportButtonMenu
                  rows={rows}
                  filenamePrefix="vyugam_classified_report"
                  metadata={exportMetadata}
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200/80">
                    <tr>
                      <th className="py-3 px-3.5 text-center w-12">#</th>
                      <th className="py-3 px-3">Pass ID</th>
                      <th className="py-3 px-3">Name</th>
                      <th className="py-3 px-3">College</th>
                      <th className="py-3 px-3">Department</th>
                      <th className="py-3 px-3 text-center w-20">Year</th>
                      <th className="py-3 px-3 text-center">Overall Entry</th>
                      <th className="py-3 px-3 text-center">Event Selections</th>
                      <th className="py-3 px-3 text-center">Event Check-ins</th>
                      <th className="py-3 px-3 text-center">Coordinator</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {isLoading ? (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-slate-400">
                          Classifying records...
                        </td>
                      </tr>
                    ) : rows.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center">
                            <Search className="w-8 h-8 text-slate-300 mb-2" />
                            <p className="font-semibold text-slate-600">No participants match filters.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      rows.map((row) => (
                        <tr key={`${row.passId}-${row.index}`} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3.5 text-center text-slate-400 font-mono text-[11px]">
                            {row.index}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                            {row.passId}
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                            {row.name}
                          </td>
                          <td className="py-3 px-3 text-slate-700 max-w-xs truncate">
                            {row.college}
                          </td>
                          <td className="py-3 px-3 text-slate-600 max-w-[150px] truncate">
                            {row.department}
                          </td>
                          <td className="py-3 px-3 text-center text-slate-600 whitespace-nowrap">
                            {row.year}
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            {row.status === 'ENTERED' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                ✓ Entered ({row.formattedTime})
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                Not Entered
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex flex-wrap gap-1 justify-center max-w-[180px] mx-auto">
                              {row.codeCrusadeSelected === 'YES' && (
                                <span className="text-[9px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">CC</span>
                              )}
                              {row.logicArenaSelected === 'YES' && (
                                <span className="text-[9px] font-bold bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">LA</span>
                              )}
                              {row.uiuxStudioSelected === 'YES' && (
                                <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">UI</span>
                              )}
                              {row.techTacticsSelected === 'YES' && (
                                <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">TT</span>
                              )}
                              {row.pixelPulseSelected === 'YES' && (
                                <span className="text-[9px] font-bold bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">PP</span>
                              )}
                              {row.codeCrusadeSelected !== 'YES' &&
                               row.logicArenaSelected !== 'YES' &&
                               row.uiuxStudioSelected !== 'YES' &&
                               row.techTacticsSelected !== 'YES' &&
                               row.pixelPulseSelected !== 'YES' && (
                                <span className="text-[10px] text-slate-400 italic">None</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap text-[11px]">
                            <div className="flex flex-col gap-0.5 text-[10px]">
                              {row.codeCrusadeCheckin && row.codeCrusadeCheckin !== 'NOT CHECKED IN' && (
                                <span className="text-blue-700 font-semibold">CC: {row.codeCrusadeCheckin}</span>
                              )}
                              {row.logicArenaCheckin && row.logicArenaCheckin !== 'NOT CHECKED IN' && (
                                <span className="text-purple-700 font-semibold">LA: {row.logicArenaCheckin}</span>
                              )}
                              {row.uiuxStudioCheckin && row.uiuxStudioCheckin !== 'NOT CHECKED IN' && (
                                <span className="text-emerald-700 font-semibold">UI: {row.uiuxStudioCheckin}</span>
                              )}
                              {row.techTacticsCheckin && row.techTacticsCheckin !== 'NOT CHECKED IN' && (
                                <span className="text-amber-700 font-semibold">TT: {row.techTacticsCheckin}</span>
                              )}
                              {row.pixelPulseCheckin && row.pixelPulseCheckin !== 'NOT CHECKED IN' && (
                                <span className="text-rose-700 font-semibold">PP: {row.pixelPulseCheckin}</span>
                              )}
                              {row.codeCrusadeCheckin === 'NOT CHECKED IN' &&
                               row.logicArenaCheckin === 'NOT CHECKED IN' &&
                               row.uiuxStudioCheckin === 'NOT CHECKED IN' &&
                               row.techTacticsCheckin === 'NOT CHECKED IN' &&
                               row.pixelPulseCheckin === 'NOT CHECKED IN' && (
                                <span className="text-slate-400">None</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                              {row.coordinatorName}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COLLEGE-WISE REPORT */}
        {activeTab === 'colleges' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden space-y-4">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  College-Wise Attendance Breakdown
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Participation rate across all attending colleges and institutes
                </p>
              </div>

              <button
                onClick={handleExportCollegeReport}
                className="touch-target px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all active:scale-95 self-start sm:self-auto"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export College Report</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200/80">
                  <tr>
                    <th className="py-3 px-4">College Name</th>
                    <th className="py-3 px-3 text-center">Total Registered</th>
                    <th className="py-3 px-3 text-center">Overall Entry</th>
                    <th className="py-3 px-3 text-center">Code Crusade</th>
                    <th className="py-3 px-3 text-center">Logic Arena</th>
                    <th className="py-3 px-3 text-center">UI/UX Studio</th>
                    <th className="py-3 px-3 text-center">Tech Tactics</th>
                    <th className="py-3 px-3 text-center">Pixel Pulse</th>
                    <th className="py-3 px-4 text-right">Attendance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {collegeRows.map((c) => {
                    const pct = c.totalParticipants > 0 ? ((c.overallAttendance / c.totalParticipants) * 100).toFixed(1) : '0';
                    return (
                      <tr key={c.college} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900 max-w-xs">
                          {c.college}
                        </td>
                        <td className="py-3.5 px-3 text-center font-bold font-mono">
                          {c.totalParticipants}
                        </td>
                        <td className="py-3.5 px-3 text-center font-bold text-emerald-700 bg-emerald-50/40">
                          {c.overallAttendance}
                        </td>
                        <td className="py-3.5 px-3 text-center text-slate-700 font-mono">
                          {c.codeCrusade}
                        </td>
                        <td className="py-3.5 px-3 text-center text-slate-700 font-mono">
                          {c.logicArena}
                        </td>
                        <td className="py-3.5 px-3 text-center text-slate-700 font-mono">
                          {c.uiuxStudio}
                        </td>
                        <td className="py-3.5 px-3 text-center text-slate-700 font-mono">
                          {c.techTactics}
                        </td>
                        <td className="py-3.5 px-3 text-center text-slate-700 font-mono">
                          {c.pixelPulse}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-blue-600 font-mono">
                          {pct}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: DEPARTMENT-WISE REPORT */}
        {activeTab === 'departments' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden space-y-4">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Department & Year Attendance Breakdown
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Detailed branch-level distribution across technical events
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200/80">
                  <tr>
                    <th className="py-3 px-4">College</th>
                    <th className="py-3 px-3">Department</th>
                    <th className="py-3 px-3 text-center">Year</th>
                    <th className="py-3 px-3 text-center">Total</th>
                    <th className="py-3 px-3 text-center">Overall</th>
                    <th className="py-3 px-3 text-center">Code</th>
                    <th className="py-3 px-3 text-center">Logic</th>
                    <th className="py-3 px-3 text-center">UI/UX</th>
                    <th className="py-3 px-3 text-center">Tech</th>
                    <th className="py-3 px-3 text-center">Pixel</th>
                    <th className="py-3 px-4 text-right">Attendance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {deptRows.map((d, idx) => {
                    const pct = d.totalParticipants > 0 ? ((d.overallAttendance / d.totalParticipants) * 100).toFixed(1) : '0';
                    return (
                      <tr key={`${d.college}-${d.department}-${d.year}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-800 max-w-xs truncate">
                          {d.college}
                        </td>
                        <td className="py-3.5 px-3 font-bold text-slate-900 max-w-[180px] truncate">
                          {d.department}
                        </td>
                        <td className="py-3.5 px-3 text-center text-slate-600 whitespace-nowrap">
                          {d.year}
                        </td>
                        <td className="py-3.5 px-3 text-center font-bold font-mono">
                          {d.totalParticipants}
                        </td>
                        <td className="py-3.5 px-3 text-center font-bold text-emerald-700 bg-emerald-50/40 font-mono">
                          {d.overallAttendance}
                        </td>
                        <td className="py-3.5 px-3 text-center text-slate-700 font-mono">
                          {d.codeCrusade}
                        </td>
                        <td className="py-3.5 px-3 text-center text-slate-700 font-mono">
                          {d.logicArena}
                        </td>
                        <td className="py-3.5 px-3 text-center text-slate-700 font-mono">
                          {d.uiuxStudio}
                        </td>
                        <td className="py-3.5 px-3 text-center text-slate-700 font-mono">
                          {d.techTactics}
                        </td>
                        <td className="py-3.5 px-3 text-center text-slate-700 font-mono">
                          {d.pixelPulse}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-blue-600 font-mono">
                          {pct}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};
