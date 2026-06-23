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
    <div className={`bg-white/90 dark:bg-gray-900/90 backdrop-blur p-2 sm:p-3 rounded-md border border-slate-200 dark:border-gray-700 flex flex-row flex-wrap gap-2 items-center shadow-sm ${className}`}>

      {/* Search Input */}
      {(onSearchChange !== undefined || searchValue !== undefined) && (
        <div className="relative flex-[1_1_100%] sm:flex-[1_1_auto] sm:max-w-xs order-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-slate-400 dark:text-gray-500" />
          </div>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-gray-200 text-xs sm:text-sm rounded-md pl-9 pr-3 py-1.5 sm:py-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          />
        </div>
      )}

      {/* Dynamic Select Filters */}
      {filters.length > 0 && (
        <div className="flex flex-row flex-wrap gap-2 flex-[1_1_auto] order-2 sm:order-2">
          {filters.map((filter, index) => (
            <div key={index} className="flex-1 min-w-[120px] sm:flex-none">
              <SelectField
                value={filter.value}
                onChange={filter.onChange}
                options={filter.options}
                placeholder={filter.placeholder}
                isClearable={filter.isClearable}
                className="text-xs sm:text-sm"
              />
            </div>
          ))}
        </div>
      )}

      {/* View Switcher Container */}
      {(viewMode && onViewModeChange) && (
        <div className="flex shrink-0 order-3 ml-auto">
          <ManagementViewSwitcher viewMode={viewMode} onChange={onViewModeChange} />
        </div>
      )}
    </div>
  );
}
