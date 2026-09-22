import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  QrCode,
  Users,
  FileSpreadsheet,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Code2,
  Cpu,
  Palette,
  Lightbulb,
  Sparkles,
  BarChart3,
  Building2
} from 'lucide-react';
import { authService } from '../../services/authService';
import { VYUGAM_EVENTS } from '../../types/event';

const EVENT_ICONS: Record<string, React.ElementType> = {
  'code-crusade': Code2,
  'logic-arena': Cpu,
  'uiux-studio': Palette,
  'tech-tactics': Lightbulb,
  'pixel-pulse': Sparkles,
};

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const session = authService.getSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [attendanceExpanded, setAttendanceExpanded] = useState(true);
  const [dashboardsExpanded, setDashboardsExpanded] = useState(true);

  const handleLogout = () => {
    authService.logout();
    navigate('/login', { replace: true });
  };

  const isCoordinatorRestricted = session?.role === 'EVENT_COORDINATOR';
  const assignedSlug = session?.assignedEventSlug;

  const isEventAllowed = (slug: string) => {
    if (!isCoordinatorRestricted) return true;
    return assignedSlug === slug;
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row text-slate-900 antialiased font-sans">
      {/* Mobile Top Header */}
      <header className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 sticky top-0 z-40 safe-top">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-base">
            V
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-wide">VYUGAM 2.0</span>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 font-semibold px-1.5 py-0.5 rounded">
                SCANNER
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              {session?.coordinatorCode} • {session?.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="touch-target p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-slate-300 flex-col flex-shrink-0 border-r border-slate-800 sticky top-0 h-screen overflow-y-auto">
        {/* Brand Banner */}
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 shadow-md shadow-blue-600/30 flex items-center justify-center font-black text-white text-lg flex-shrink-0">
            V
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-wide text-white">VYUGAM 2.0</span>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 font-bold px-1.5 py-0.5 rounded border border-blue-400/30">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-400">Attendance & Entry System</p>
          </div>
        </div>

        {/* Coordinator Profile Card */}
        <div className="px-4 py-3.5 m-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              {session?.role === 'ADMIN'
                ? 'Administrator'
                : session?.role === 'OVERALL_COORDINATOR'
                ? 'Overall Coordinator'
                : 'Event Coordinator'}
            </span>
            <span className="font-mono text-xs font-bold text-white bg-slate-700 px-1.5 py-0.5 rounded">
              {session?.coordinatorCode}
            </span>
          </div>
          <p className="text-xs font-bold text-white truncate">{session?.name}</p>
          {session?.assignedEventName && (
            <p className="text-[11px] text-amber-300 font-semibold truncate mt-0.5">
              Assigned: {session.assignedEventName}
            </p>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 text-xs font-semibold">
          {/* Main Dashboard */}
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`
            }
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </NavLink>

          {/* ATTENDANCE SECTION (SCANNERS) */}
          <div className="pt-2">
            <button
              onClick={() => setAttendanceExpanded(!attendanceExpanded)}
              className="w-full flex items-center justify-between px-3 py-2 text-slate-400 hover:text-white uppercase tracking-wider text-[11px] font-bold rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2">
                <QrCode className="w-3.5 h-3.5 text-blue-400" />
                <span>Attendance Scanners</span>
              </div>
              {attendanceExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {attendanceExpanded && (
              <div className="ml-2 pl-2 border-l border-slate-800 space-y-1 mt-1">
                {/* Overall Attendance */}
                {(!isCoordinatorRestricted || session?.role === 'OVERALL_COORDINATOR') && (
                  <NavLink
                    to="/attendance/overall"
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white font-bold'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800'
                      }`
                    }
                  >
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Overall Attendance</span>
                  </NavLink>
                )}

                {/* 5 Event Scanners */}
                {VYUGAM_EVENTS.map((event) => {
                  const Icon = EVENT_ICONS[event.slug] || QrCode;
                  const isAllowed = isEventAllowed(event.slug);

                  if (!isAllowed && isCoordinatorRestricted) return null;

                  return (
                    <NavLink
                      key={event.id}
                      to={`/attendance/event/${event.slug}`}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-blue-600 text-white font-bold'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800'
                        }`
                      }
                    >
                      <Icon className="w-3.5 h-3.5 text-blue-400" />
                      <span className="truncate">{event.name}</span>
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>

          {/* DASHBOARDS SECTION */}
          <div className="pt-2">
            <button
              onClick={() => setDashboardsExpanded(!dashboardsExpanded)}
              className="w-full flex items-center justify-between px-3 py-2 text-slate-400 hover:text-white uppercase tracking-wider text-[11px] font-bold rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Event Dashboards</span>
              </div>
              {dashboardsExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {dashboardsExpanded && (
              <div className="ml-2 pl-2 border-l border-slate-800 space-y-1 mt-1">
                <NavLink
                  to="/dashboard/overall"
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`
                  }
                >
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Overall Dashboard</span>
                </NavLink>

                {VYUGAM_EVENTS.map((event) => {
                  const isAllowed = isEventAllowed(event.slug);
                  if (!isAllowed && isCoordinatorRestricted) return null;

                  return (
                    <NavLink
                      key={`dash-${event.id}`}
                      to={`/dashboard/events/${event.slug}`}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-blue-600 text-white font-bold'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800'
                        }`
                      }
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{event.name}</span>
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>

          {/* Participants */}
          <div className="pt-2">
            <NavLink
              to="/participants"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <Users className="w-4 h-4 text-slate-400" />
              <span>Participants</span>
            </NavLink>
          </div>

          {/* Reports & Exports */}
          <NavLink
            to="/reports"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`
            }
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-400" />
            <span>Reports & Exports</span>
          </NavLink>

          {/* Settings */}
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`
            }
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Settings</span>
          </NavLink>
        </nav>

        {/* Footer Logout */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 md:hidden animate-fadeIn"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-72 max-w-[80vw] h-full bg-slate-900 text-white p-5 flex flex-col justify-between overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              {/* Drawer Brand */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white">
                    V
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm">VYUGAM 2.0</h3>
                    <p className="text-[11px] text-slate-400">Scanner & Entry</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Coordinator Info */}
              <div className="p-3 bg-slate-800 rounded-xl mb-4 text-xs">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
                  {session?.coordinatorCode} • {session?.role}
                </span>
                <p className="font-bold text-white mt-0.5 truncate">{session?.name}</p>
                {session?.assignedEventName && (
                  <p className="text-[11px] text-amber-300 font-semibold mt-0.5">
                    {session.assignedEventName}
                  </p>
                )}
              </div>

              {/* Mobile Nav Links */}
              <div className="space-y-1 text-xs font-semibold">
                <NavLink
                  to="/"
                  end
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-800"
                >
                  <LayoutDashboard className="w-4 h-4 text-blue-400" />
                  <span>Dashboard</span>
                </NavLink>

                <div className="pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Scanners
                </div>

                <NavLink
                  to="/attendance/overall"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-800 text-emerald-400 font-bold"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Overall Attendance</span>
                </NavLink>

                {VYUGAM_EVENTS.map((event) => {
                  const isAllowed = isEventAllowed(event.slug);
                  if (!isAllowed && isCoordinatorRestricted) return null;
                  return (
                    <NavLink
                      key={`mob-${event.id}`}
                      to={`/attendance/event/${event.slug}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-800"
                    >
                      <QrCode className="w-4 h-4 text-blue-400" />
                      <span>{event.name}</span>
                    </NavLink>
                  );
                })}

                <div className="pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Data & Reports
                </div>

                <NavLink
                  to="/dashboard/overall"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-800"
                >
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <span>Overall Dashboard</span>
                </NavLink>

                <NavLink
                  to="/participants"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-800"
                >
                  <Users className="w-4 h-4 text-slate-400" />
                  <span>Participants</span>
                </NavLink>

                <NavLink
                  to="/reports"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-800"
                >
                  <FileSpreadsheet className="w-4 h-4 text-slate-400" />
                  <span>Reports & Exports</span>
                </NavLink>

                <NavLink
                  to="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-800"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Settings</span>
                </NavLink>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-rose-400 hover:bg-slate-800 rounded-lg text-xs font-bold w-full mt-4"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {children}
      </div>
    </div>
  );
};
