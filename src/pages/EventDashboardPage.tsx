import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/Navigation/AppShell';
import { StatCard } from '../components/Common/StatCard';
import { FilterToolbar } from '../components/Common/FilterToolbar';
import { ExportButtonMenu } from '../components/Common/ExportButtonMenu';
import { attendanceService } from '../services/attendanceService';
import { authService } from '../services/authService';
import { getEventBySlug, VyugamEvent } from '../types/event';
import { EventStats, ClassificationFilters, ClassificationRow } from '../types/attendance';
import { exportToExcel } from '../utils/export';
import {
  Users,
  CheckCircle2,
  Clock,
  QrCode,
  RefreshCw,
  Search,
  Sparkles,
  BarChart2,
  FileSpreadsheet
} from 'lucide-react';

export const EventDashboardPage: React.FC = () => {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const navigate = useNavigate();
  const session = authService.getSession();

  const [event, setEvent] = useState<VyugamEvent | undefined>(undefined);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [rows, setRows] = useState<ClassificationRow[]>([]);
  const [filters, setFilters] = useState<ClassificationFilters>({
    status: 'ALL'
  });
  const [isLoading, setIsLoading] = useState(true);

  const filterOptions = useMemo(() => {
    return attendanceService.getFilterOptions();
  }, []);

  const loadData = useCallback(async () => {
    if (!eventSlug) return;
    const ev = getEventBySlug(eventSlug);
    setEvent(ev);

    if (!ev) return;

    setIsLoading(true);
    try {
      const [s, r] = await Promise.all([
        attendanceService.getEventStats(ev.slug),
        attendanceService.getClassificationRows({
          ...filters,
          eventSlug: ev.slug
        })
      ]);
      setStats(s);
      setRows(r);
    } catch (err) {
      console.error('Failed to load event dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [eventSlug, filters]);

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

  const isCoordinatorRestricted = session?.role === 'EVENT_COORDINATOR';
  const canScan = !isCoordinatorRestricted || session?.assignedEventSlug === eventSlug;

  const exportMetadata = {
    title: `${event?.name.toUpperCase()} ATTENDANCE REPORT`,
    subtitle: `Official Event Attendance Log`,
    scope: 'EVENT' as const,
    eventSlug: event?.slug,
    eventName: event?.name,
    filters: {
      College: filters.college,
      Department: filters.department,
      Year: filters.year,
      Status: filters.status
    }
  };

  const handleExportSummary = async () => {
    if (!event || !stats) return;

    // Generate comprehensive summary sheet
    const summaryRows: ClassificationRow[] = rows.filter(r => r.status === 'ENTERED');
    exportToExcel(summaryRows, `${event.slug}_event_summary.xlsx`, {
      title: `${event.name.toUpperCase()} — EVENT ATTENDANCE SUMMARY`,
      subtitle: `Venue Attendance: ${stats.overallAttendees} | Event Attendance: ${stats.eventCheckins} (${stats.eventAttendanceRate}%)`,
      scope: 'EVENT',
      eventSlug: event.slug,
      eventName: event.name,
      filters: {
        'Total Registered': String(stats.totalRegistered),
        'Overall Venue Attendees': String(stats.overallAttendees),
        'Event Check-ins': String(stats.eventCheckins),
        'Event Attendance Rate': `${stats.eventAttendanceRate}%`
      }
    });
  };

  if (!event) {
    return (
      <AppShell>
        <div className="flex-1 p-8 text-center text-slate-500">
          Event not found.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 shadow-md shadow-blue-600/20 text-white flex items-center justify-center flex-shrink-0 font-bold">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {event.name} Dashboard
                </h1>
                <span className="text-xs bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full border border-blue-200">
                  {event.code}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {event.description}
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

            <button
              onClick={handleExportSummary}
              className="touch-target px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
              title="Export Event Summary with breakdown"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export Summary</span>
            </button>

            {canScan && (
              <button
                onClick={() => navigate(`/attendance/event/${event.slug}`)}
                className="touch-target px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all active:scale-95"
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
            title="Selected Participants"
            value={stats?.selectedParticipants ?? '--'}
            subtitle="Intended event participants"
            icon={Users}
            color="indigo"
          />

          <StatCard
            title="Event Check-ins"
            value={stats?.eventCheckins ?? '--'}
            subtitle="Actually checked into event"
            icon={CheckCircle2}
            color="blue"
          />

          <StatCard
            title="Selected Not Checked In"
            value={stats?.selectedNotCheckedIn ?? '--'}
            subtitle="Selected but awaiting scan"
            icon={Clock}
            color="amber"
          />

          <StatCard
            title="Turnout Among Selected"
            value={`${stats?.attendancePercentageAmongSelected ?? 0}%`}
            subtitle={`${stats?.eventCheckins ?? 0} of ${stats?.selectedParticipants ?? 0} selected`}
            icon={BarChart2}
            color="emerald"
            trend="Conversion"
          />
        </div>

        {/* Secondary Venue Context Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Overall Venue Attendees</span>
              <span className="text-lg font-black text-slate-800">{stats?.overallAttendees ?? '--'}</span>
            </div>
            <span className="text-xs bg-purple-50 text-purple-700 font-bold px-2 py-1 rounded-md">Gate Entry</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Venue Participation Rate</span>
              <span className="text-lg font-black text-slate-800">{stats?.eventAttendanceRate ?? 0}%</span>
            </div>
            <span className="text-xs bg-blue-50 text-blue-700 font-bold px-2 py-1 rounded-md">Ratio</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between col-span-2 sm:col-span-1">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Registered</span>
              <span className="text-lg font-black text-slate-800">{stats?.totalRegistered ?? '--'}</span>
            </div>
            <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2 py-1 rounded-md">Master DB</span>
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
                  {event.name} Participants
                </h3>
                <span className="text-xs font-bold font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                  {rows.length} records
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Filtered attendees for this competition
              </p>
            </div>

            {/* Export Toolbar */}
            <ExportButtonMenu
              rows={rows}
              filenamePrefix={`vyugam_${event.slug}_attendance`}
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
                  <th className="py-3 px-3 text-right">Check-in Time</th>
                  <th className="py-3 px-3 text-center">Coordinator</th>
                  <th className="py-3 px-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      Loading {event.name} records...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center">
                        <Search className="w-8 h-8 text-slate-300 mb-2" />
                        <p className="font-semibold text-slate-600">No check-ins recorded yet.</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Participants will appear here once scanned.</p>
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
