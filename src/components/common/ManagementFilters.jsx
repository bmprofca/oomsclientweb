import React from 'react';
import { Search } from 'lucide-react';
import ManagementViewSwitcher from './ManagementViewSwitcher';
import SelectField from './SelectField';

export default function ManagementFilters({
  viewMode,
  onViewModeChange,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters = [], // Array of { name, options, value, onChange, placeholder }
  className = '',
}) {
  return (
    <div className={`bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-md border border-slate-200 dark:border-gray-700 flex flex-col md:flex-row gap-3 md:items-center justify-between shadow-sm ${className}`}>

      {/* Search and Filters Container */}
      <div className="flex flex-col sm:flex-row flex-1 gap-3 w-full md:w-auto">

        {/* Search Input */}
        {(onSearchChange !== undefined || searchValue !== undefined) && (
          <div className="relative w-full sm:max-w-xs md:max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-slate-400 dark:text-gray-500" />
            </div>
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-gray-200 text-sm rounded-md pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>
        )}

        {/* Dynamic Select Filters */}
        {filters.length > 0 && (
          <div className="flex flex-wrap gap-2 sm:gap-3 flex-1">
            {filters.map((filter, index) => (
              <div key={index} className="w-full sm:w-auto min-w-[140px] rounded-md">
                <SelectField
                  value={filter.value}
                  onChange={filter.onChange}
                  options={filter.options}
                  placeholder={filter.placeholder}
                  isClearable={filter.isClearable}
                  className="text-sm"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View Switcher Container */}
      {(viewMode && onViewModeChange) && (
        <div className="flex justify-end pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-gray-700 shrink-0">
          <ManagementViewSwitcher viewMode={viewMode} onChange={onViewModeChange} />
        </div>
      )}
    </div>
  );
}
