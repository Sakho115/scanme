import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/Navigation/AppShell';
import { StatCard } from '../components/Common/StatCard';
import { FilterToolbar } from '../components/Common/FilterToolbar';
import { ExportButtonMenu } from '../components/Common/ExportButtonMenu';
import { attendanceService } from '../services/attendanceService';
import { authService } from '../services/authService';
import { OverallStats, ClassificationFilters, ClassificationRow } from '../types/attendance';
import { exportToExcel, exportToPDF, exportToCSV } from '../utils/export';
import {
  Building2,
  Users,
  CheckCircle2,
  Clock,
  QrCode,
  RefreshCw,
  Search,
  Sparkles,
  FileSpreadsheet,
  FileText
} from 'lucide-react';


export const OverallDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const session = authService.getSession();

  const [stats, setStats] = useState<OverallStats | null>(null);
  const [rows, setRows] = useState<ClassificationRow[]>([]);
  const [filters, setFilters] = useState<ClassificationFilters>({
    attendanceType: 'OVERALL',
    status: 'ALL'
  });
  const [isLoading, setIsLoading] = useState(true);

  const filterOptions = useMemo(() => {
    return attendanceService.getFilterOptions();
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [s, r] = await Promise.all([
        attendanceService.getOverallStats(),
        attendanceService.getClassificationRows({
          ...filters,
          attendanceType: 'OVERALL'
        })
      ]);
      setStats(s);
      setRows(r);
    } catch (err) {
      console.error('Failed to load overall dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
    const unsubscribe = attendanceService.subscribeToAttendanceUpdates(() => {
      loadData();
    });
    return () => {
      unsubscribe();
    };
  }, [loadData]);

  // Window focus listener for fresh data when switching tabs/windows
  useEffect(() => {
    const handleFocus = () => {
      loadData();
    };
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadData]);

  const exportMetadata = {
    title:
      filters.status === 'ENTERED'
        ? 'OVERALL VENUE ATTENDANCE REPORT (ENTERED ONLY)'
        : filters.status === 'NOT_ENTERED'
        ? 'OVERALL VENUE ATTENDANCE REPORT (NOT ENTERED ONLY)'
        : 'OVERALL VENUE ATTENDANCE REPORT',
    subtitle: 'VYUGAM 2.0 Physical Entry Gates & Event Selections',
    scope: 'OVERALL' as const,
    filters: {
      College: filters.college,
      Department: filters.department,
      Year: filters.year,
      Status: filters.status || 'ALL'
    }
  };

  const filenameSuffix =
    filters.status === 'ENTERED'
      ? '_entered'
      : filters.status === 'NOT_ENTERED'
      ? '_not_entered'
      : '';

  const handleExportSheets = () => {
    exportToExcel(rows, `vyugam_overall_attendance${filenameSuffix}.xlsx`, exportMetadata);
  };

  const handleExportPDF = () => {
    exportToPDF(rows, `vyugam_overall_attendance${filenameSuffix}.pdf`, exportMetadata);
  };

  const handleExportCSV = () => {
    exportToCSV(rows, `vyugam_overall_attendance${filenameSuffix}.csv`, exportMetadata);
  };

  return (
    <AppShell>
      <div className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 shadow-md shadow-emerald-600/20 text-white flex items-center justify-center flex-shrink-0 font-bold">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Overall Attendance Dashboard
                </h1>
                <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  Venue Gate
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time gate check-ins & event selections for all registered participants
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {/* Quick Export Sheets */}
            <button
              onClick={handleExportSheets}
              className="touch-target px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
              title="Download Excel Sheet with Event Selections"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Download Sheets</span>
            </button>

            {/* Quick Export CSV */}
            <button
              onClick={handleExportCSV}
              className="touch-target px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
              title="Download CSV with Event Selections"
            >
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              <span>Download CSV</span>
            </button>

            {/* Quick Export PDF */}
            <button
              onClick={handleExportPDF}
              className="touch-target px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
              title="Download PDF Report"
            >
              <FileText className="w-4 h-4 text-rose-600" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={loadData}
              disabled={isLoading}
              className="touch-target p-2.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {(session?.role === 'ADMIN' || session?.role === 'OVERALL_COORDINATOR') && (
              <button
                onClick={() => navigate('/attendance/overall')}
                className="touch-target px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all active:scale-95"
              >
                <QrCode className="w-4 h-4" />
                <span>Open Scanner</span>
              </button>
            )}
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Registered"
            value={stats?.totalRegistered ?? '--'}
            subtitle="Participants in master DB"
            icon={Users}
            color="blue"
          />

          <StatCard
            title="Overall Checked In"
            value={stats?.overallCheckedIn ?? '--'}
            subtitle="Passed through gate"
            icon={CheckCircle2}
            color="emerald"
          />

          <StatCard
            title="Not Yet Entered"
            value={stats?.remaining ?? '--'}
            subtitle="Awaiting gate arrival"
            icon={Clock}
            color="amber"
          />

          <StatCard
            title="Attendance Percentage"
            value={`${stats?.attendancePercentage ?? 0}%`}
            subtitle="Of total registrations"
            icon={Building2}
            color="indigo"
          />
        </div>

        {/* Event Participation Statistics (Main Gate Selections) */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <h2 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                Event Participation (Selected Events)
              </h2>
            </div>
            <span className="text-[11px] text-slate-500 italic">
              Recorded at gate entry • Distinct from actual event attendance
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
                Code Crusade
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-black text-blue-950">
                  {stats?.eventSelections?.codeCrusade ?? 0}
                </span>
                <span className="text-[11px] text-blue-600 font-semibold">selected</span>
              </div>
            </div>

            <div className="bg-purple-50/60 border border-purple-100 rounded-xl p-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
                Logic Arena
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-black text-purple-950">
                  {stats?.eventSelections?.logicArena ?? 0}
                </span>
                <span className="text-[11px] text-purple-600 font-semibold">selected</span>
              </div>
            </div>

            <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                UI/UX Studio
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-black text-emerald-950">
                  {stats?.eventSelections?.uiuxStudio ?? 0}
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold">selected</span>
              </div>
            </div>

            <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                Tech Tactics
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-black text-amber-950">
                  {stats?.eventSelections?.techTactics ?? 0}
                </span>
                <span className="text-[11px] text-amber-600 font-semibold">selected</span>
              </div>
            </div>

            <div className="bg-rose-50/60 border border-rose-100 rounded-xl p-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">
                Pixel Pulse
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-black text-rose-950">
                  {stats?.eventSelections?.pixelPulse ?? 0}
                </span>
                <span className="text-[11px] text-rose-600 font-semibold">selected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Classification Filter Toolbar */}
        <FilterToolbar
          filters={filters}
          onChange={setFilters}
          options={filterOptions}
          showStatusFilter={true}
        />

        {/* Table & Export Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-slate-900">
                  Overall Attendees Directory
                </h3>
                <span className="text-xs font-bold font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                  {rows.length} records
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-dimensional classification matching current filters
              </p>
            </div>

            {/* Export Toolbar */}
            <ExportButtonMenu
              rows={rows}
              filenamePrefix="vyugam_overall_attendance"
              metadata={exportMetadata}
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-3.5 text-center w-12">#</th>
                  <th className="py-3 px-3">Pass ID</th>
                  <th className="py-3 px-3">Participant Name</th>
                  <th className="py-3 px-3">College</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3 text-center w-20">Year</th>
                  <th className="py-3 px-3">Events Selected (Gate)</th>
                  <th className="py-3 px-3 text-right">Check-in Time</th>
                  <th className="py-3 px-3 text-center">Coordinator</th>
                  <th className="py-3 px-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      Loading attendance records...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center">
                        <Search className="w-8 h-8 text-slate-300 mb-2" />
                        <p className="font-semibold text-slate-600">No participants found.</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Try resetting or broadening your filters.</p>
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
                      <td className="py-3 px-3 text-slate-600 max-w-[180px] truncate">
                        {row.department}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-600 whitespace-nowrap">
                        {row.year}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {row.codeCrusadeSelected === 'YES' && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
                              Code Crusade
                            </span>
                          )}
                          {row.logicArenaSelected === 'YES' && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 whitespace-nowrap">
                              Logic Arena
                            </span>
                          )}
                          {row.uiuxStudioSelected === 'YES' && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                              UI/UX Studio
                            </span>
                          )}
                          {row.techTacticsSelected === 'YES' && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
                              Tech Tactics
                            </span>
                          )}
                          {row.pixelPulseSelected === 'YES' && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
                              Pixel Pulse
                            </span>
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
                      <td className="py-3 px-3 text-right font-mono text-slate-600 whitespace-nowrap">
                        {row.formattedTime}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          {row.coordinatorName}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        {row.status === 'ENTERED' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            ✓ Entered
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            Not Entered
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
};
