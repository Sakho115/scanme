import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/Navigation/AppShell';
import { StatCard } from '../components/Common/StatCard';
import { attendanceService } from '../services/attendanceService';
import { authService } from '../services/authService';
import { VYUGAM_EVENTS, VyugamEvent } from '../types/event';
import { OverallStats, EventStats } from '../types/attendance';
import { exportToExcel, exportToPDF } from '../utils/export';
import {
  Users,
  Building2,
  QrCode,
  BarChart3,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  Clock,
  Code2,
  Cpu,
  Palette,
  Lightbulb,
  Sparkles,
  ArrowRight
} from 'lucide-react';

const EVENT_ICONS: Record<string, React.ElementType> = {
  'code-crusade': Code2,
  'logic-arena': Cpu,
  'uiux-studio': Palette,
  'tech-tactics': Lightbulb,
  'pixel-pulse': Sparkles,
};

export const MainDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const session = authService.getSession();

  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [eventStatsList, setEventStatsList] = useState<Record<string, EventStats>>({});
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const overall = await attendanceService.getOverallStats();
      setOverallStats(overall);

      const eventMap: Record<string, EventStats> = {};
      await Promise.all(
        VYUGAM_EVENTS.map(async (ev) => {
          const s = await attendanceService.getEventStats(ev.slug);
          if (s) eventMap[ev.slug] = s;
        })
      );
      setEventStatsList(eventMap);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const isCoordinatorRestricted = session?.role === 'EVENT_COORDINATOR';
  const assignedSlug = session?.assignedEventSlug;

  const canScanEvent = (slug: string) => {
    if (!isCoordinatorRestricted) return true;
    return assignedSlug === slug;
  };

  const handleExportEvent = async (event: VyugamEvent, type: 'excel' | 'pdf') => {
    const rows = await attendanceService.getClassificationRows({
      eventSlug: event.slug,
      status: 'ENTERED'
    });

    const meta = {
      title: `${event.name.toUpperCase()} ATTENDANCE`,
      subtitle: `Official Event Attendance Log`
    };

    if (type === 'excel') {
      exportToExcel(rows, `${event.slug}_attendance.xlsx`, meta);
    } else {
      exportToPDF(rows, `${event.slug}_attendance.pdf`, meta);
    }
  };

  const handleExportOverall = async (type: 'excel' | 'pdf') => {
    const rows = await attendanceService.getClassificationRows({
      attendanceType: 'OVERALL',
      status: 'ALL'
    });

    const meta = {
      title: 'OVERALL VENUE ATTENDANCE REPORT',
      subtitle: 'Official Venue Gate & Event Participation Log',
      scope: 'OVERALL' as const
    };

    if (type === 'excel') {
      exportToExcel(rows, 'vyugam_overall_attendance.xlsx', meta);
    } else {
      exportToPDF(rows, 'vyugam_overall_attendance.pdf', meta);
    }
  };

  return (
    <AppShell>
      <div className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Top Banner */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
              <Building2 className="w-4 h-4" />
              <span>Event Operations Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              VYUGAM 2.0 Attendance Overview
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Logged in as <strong className="text-slate-800">{session?.name}</strong> ({session?.coordinatorCode} • {session?.role})
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={loadData}
              disabled={isLoading}
              className="touch-target p-2.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              title="Refresh Stats"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {(!isCoordinatorRestricted || session?.role === 'OVERALL_COORDINATOR') && (
              <button
                onClick={() => navigate('/attendance/overall')}
                className="touch-target px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all active:scale-95"
              >
                <QrCode className="w-4 h-4" />
                <span>Overall Scanner</span>
              </button>
            )}
          </div>
        </div>

        {/* Global Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Registered"
            value={overallStats?.totalRegistered ?? '--'}
            subtitle="Verified participants"
            icon={Users}
            color="blue"
          />

          <StatCard
            title="Overall Checked In"
            value={overallStats?.overallCheckedIn ?? '--'}
            subtitle={`Remaining: ${overallStats?.remaining ?? '--'}`}
            icon={Building2}
            color="emerald"
            trend={`${overallStats?.attendancePercentage ?? 0}%`}
          />

          <StatCard
            title="Venue Attendance Rate"
            value={`${overallStats?.attendancePercentage ?? 0}%`}
            subtitle="Of all registered attendees"
            icon={BarChart3}
            color="indigo"
          />

          <StatCard
            title="Active Events"
            value="5"
            subtitle="Code, Logic, UI/UX, Tech, Pixel"
            icon={Sparkles}
            color="purple"
          />
        </div>

        {/* OVERALL GATE ATTENDANCE SPOTLIGHT CARD */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-5 sm:p-6 text-white shadow-lg border border-slate-700/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Primary Entry Gate & Participation Tracking
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Overall Venue Attendance Dashboard
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Access the dedicated overall venue portal to review real-time participant arrivals, inspect event preferences selected at the gate, and export complete reports.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={() => handleExportOverall('excel')}
              className="touch-target px-3.5 py-2.5 bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-900/30"
              title="Download Excel Spreadsheet with Event Selections"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>Download Sheets</span>
            </button>

            <button
              onClick={() => handleExportOverall('pdf')}
              className="touch-target px-3.5 py-2.5 bg-rose-600/90 hover:bg-rose-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-rose-900/30"
              title="Download PDF Report"
            >
              <FileText className="w-4 h-4 text-rose-200" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={() => navigate('/dashboard/overall')}
              className="touch-target px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md"
            >
              <span>Open Overall Dashboard</span>
              <ArrowRight className="w-4 h-4 text-slate-700" />
            </button>
          </div>
        </div>

        {/* FIVE EVENT ATTENDANCE CARDS */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">Events Attendance</h2>
              <p className="text-xs text-slate-500">Real-time gate statistics for all 5 technical competitions</p>
            </div>
            <button
              onClick={() => navigate('/reports')}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
            >
              <span>View Full Reports</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {VYUGAM_EVENTS.map((event) => {
              const Icon = EVENT_ICONS[event.slug] || QrCode;
              const stats = eventStatsList[event.slug];
              const isAllowed = canScanEvent(event.slug);
              const lastCheckin = stats?.recentCheckins?.[0]?.checkinTime;

              return (
                <div
                  key={event.id}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-base text-slate-900">{event.name}</h3>
                          <span className="text-[10px] font-mono text-slate-400 font-bold">{event.code}</span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                        {stats?.attendancePercentage ?? 0}%
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-1">{event.description}</p>
                  </div>

                  {/* Attendance Stats Counter */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Checked In
                      </span>
                      <span className="text-xl font-black text-slate-900">
                        {stats?.eventCheckins ?? 0}
                      </span>
                      <span className="text-xs text-slate-400 font-medium ml-1">
                        / {stats?.totalRegistered ?? 0}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block flex items-center justify-end gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Last Entry
                      </span>
                      <span className="text-xs font-bold font-mono text-slate-700">
                        {lastCheckin ? new Date(lastCheckin).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : 'No check-ins'}
                      </span>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="space-y-2 pt-1 border-t border-slate-100">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => navigate(`/dashboard/events/${event.slug}`)}
                        className="touch-target py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <BarChart3 className="w-3.5 h-3.5 text-slate-600" />
                        <span>Dashboard</span>
                      </button>

                      <button
                        onClick={() => navigate(`/attendance/event/${event.slug}`)}
                        disabled={!isAllowed}
                        className={`touch-target py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                          isAllowed
                            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                        title={isAllowed ? 'Open Camera Scanner' : 'Unauthorized for this event'}
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Scanner</span>
                      </button>
                    </div>

                    {/* Quick Exports */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Export:
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleExportEvent(event, 'excel')}
                          className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 hover:underline"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          Excel
                        </button>
                        <span className="text-slate-300">•</span>
                        <button
                          onClick={() => handleExportEvent(event, 'pdf')}
                          className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 hover:underline"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          PDF
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
};
