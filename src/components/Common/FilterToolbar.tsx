import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { ClassificationFilters } from '../../types/attendance';

interface FilterToolbarProps {
  filters: ClassificationFilters;
  onChange: (filters: ClassificationFilters) => void;
  options: {
    colleges: string[];
    departments: string[];
    years: string[];
  };
  showStatusFilter?: boolean;
}

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  filters,
  onChange,
  options,
  showStatusFilter = true
}) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, search: e.target.value });
  };

  const handleSelectChange = (key: keyof ClassificationFilters, value: string) => {
    onChange({ ...filters, [key]: value === 'ALL' ? undefined : value });
  };

  const handleReset = () => {
    onChange({
      search: '',
      college: undefined,
      department: undefined,
      year: undefined,
      status: undefined,
      eventSelected: undefined,
      coordinatorId: undefined
    });
  };

  const hasActiveFilters = Boolean(
    filters.search ||
    filters.college ||
    filters.department ||
    filters.year ||
    (filters.status && filters.status !== 'ALL') ||
    (filters.eventSelected && filters.eventSelected !== 'ALL') ||
    filters.coordinatorId
  );

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80 space-y-3">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={filters.search || ''}
            onChange={handleSearchChange}
            placeholder="Search by Name, Pass ID, College..."
            className="w-full pl-10 pr-3 py-2.5 text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder-slate-400 transition-all"
          />
        </div>

        {/* Reset Filter Button */}
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="touch-target px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-1.5 transition-colors self-end sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Filter Dropdowns Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
        {/* College Filter */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            College
          </label>
          <select
            value={filters.college || 'ALL'}
            onChange={(e) => handleSelectChange('college', e.target.value)}
            className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 truncate"
          >
            <option value="ALL">All Colleges</option>
            {options.colleges.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Department Filter */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Department
          </label>
          <select
            value={filters.department || 'ALL'}
            onChange={(e) => handleSelectChange('department', e.target.value)}
            className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 truncate"
          >
            <option value="ALL">All Departments</option>
            {options.departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Year Filter */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Year
          </label>
          <select
            value={filters.year || 'ALL'}
            onChange={(e) => handleSelectChange('year', e.target.value)}
            className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 truncate"
          >
            <option value="ALL">All Years</option>
            {options.years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        {showStatusFilter && (
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Attendance Status
            </label>
            <select
              value={filters.status || 'ALL'}
              onChange={(e) => handleSelectChange('status', e.target.value)}
              className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Status</option>
              <option value="ENTERED">Checked In</option>
              <option value="NOT_ENTERED">Not Entered</option>
            </select>
          </div>
        )}

        {/* Event Selected Filter */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Event Selected
          </label>
          <select
            value={filters.eventSelected || 'ALL'}
            onChange={(e) => handleSelectChange('eventSelected', e.target.value)}
            className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 truncate"
          >
            <option value="ALL">All Selections</option>
            <option value="code-crusade">Code Crusade</option>
            <option value="logic-arena">Logic Arena</option>
            <option value="uiux-studio">UI/UX Studio</option>
            <option value="tech-tactics">Tech Tactics</option>
            <option value="pixel-pulse">Pixel Pulse</option>
          </select>
        </div>
      </div>
    </div>
  );
};
