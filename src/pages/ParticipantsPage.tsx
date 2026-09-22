import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { AppShell } from '../components/Navigation/AppShell';
import { participantService } from '../services/participantService';
import { attendanceService } from '../services/attendanceService';
import { Participant } from '../types/participant';
import {
  Users,
  Search,
  Upload,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';

export const ParticipantsPage: React.FC = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [search, setSearch] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [yearFilter, setYearFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Future import modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const filterOptions = useMemo(() => {
    return attendanceService.getFilterOptions();
  }, []);

  const loadParticipants = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await participantService.getParticipants({
        search,
        college: collegeFilter,
        department: deptFilter,
        year: yearFilter
      });
      setParticipants(list);
    } catch (err) {
      console.error('Failed to load participants:', err);
    } finally {
      setIsLoading(false);
    }
  }, [search, collegeFilter, deptFilter, yearFilter]);

  useEffect(() => {
    loadParticipants();
  }, [loadParticipants]);

  const handleSimulateImport = () => {
    setImportStatus('Parsed 50 attendee records. Supabase import pipeline ready.');
    setTimeout(() => {
      setImportStatus(null);
      setIsImportModalOpen(false);
    }, 2500);
  };

  return (
    <AppShell>
      <div className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 shadow-md shadow-blue-600/20 text-white flex items-center justify-center flex-shrink-0 font-bold">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Participants Master Directory
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Pre-registered attendees synced from the primary registration portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadParticipants}
              disabled={isLoading}
              className="touch-target p-2.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              title="Refresh Participants"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setIsImportModalOpen(true)}
              className="touch-target px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Upload className="w-4 h-4 text-blue-400" />
              <span>Import CSV / Excel</span>
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80 space-y-3">
          <div className="relative w-full sm:w-96">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Name, Pass ID, QR token, College..."
              className="w-full pl-10 pr-3.5 py-2.5 text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder-slate-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                College
              </label>
              <select
                value={collegeFilter}
                onChange={(e) => setCollegeFilter(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 truncate"
              >
                <option value="ALL">All Colleges</option>
                {filterOptions.colleges.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Department
              </label>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 truncate"
              >
                <option value="ALL">All Departments</option>
                {filterOptions.departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Year
              </label>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 truncate"
              >
                <option value="ALL">All Years</option>
                {filterOptions.years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Participants Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-slate-900">Registered Participants</h3>
              <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                {participants.length} records
              </span>
            </div>
          </div>

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
                  <th className="py-3 px-3">QR Token Preview</th>
                  <th className="py-3 px-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Loading participants...
                    </td>
                  </tr>
                ) : participants.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No participants match the specified filters.
                    </td>
                  </tr>
                ) : (
                  participants.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3.5 text-center text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                        {p.passId}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                        {p.name}
                      </td>
                      <td className="py-3 px-3 text-slate-700 max-w-xs truncate">
                        {p.college}
                      </td>
                      <td className="py-3 px-3 text-slate-600 max-w-[180px] truncate">
                        {p.department}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-600 whitespace-nowrap">
                        {p.year}
                      </td>
                      <td className="py-3 px-3 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                        {p.qrToken.slice(0, 8)}...{p.qrToken.slice(-8)}
                      </td>
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          {p.registrationStatus || 'ACTIVE'}
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

      {/* Future Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Import Attendees</h3>
                <p className="text-xs text-slate-500">Upload CSV / XLSX to Supabase master database</p>
              </div>
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-blue-500 transition-colors cursor-pointer bg-slate-50">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">Drag & drop CSV or Excel file here</p>
              <p className="text-[11px] text-slate-400 mt-1">Columns: internalId, passId, qrToken, name, college, department, year</p>
            </div>

            {importStatus && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{importStatus}</span>
              </div>
            )}

            <div className="flex items-center gap-3 mt-5">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="touch-target flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSimulateImport}
                className="touch-target flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Start Import
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
};
