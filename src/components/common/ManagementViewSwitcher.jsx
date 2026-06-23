import React from 'react';
import { FaTh, FaListUl } from 'react-icons/fa';

const colorClasses = {
  active: 'bg-blue-600 text-white shadow-md',
  inactive: 'text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-gray-800',
};

const iconByView = {
  table: FaListUl,
  card: FaTh,
};

export default function ManagementViewSwitcher({
  viewMode,
  onChange,
  className = '',
}) {
  const buttonClass = (mode) =>
    `px-2 py-1.5 sm:px-4 sm:py-2 rounded-md text-[11px] sm:text-sm font-semibold transition-all flex items-center gap-1 sm:gap-2 ${viewMode === mode ? colorClasses.active : colorClasses.inactive
    }`;

  const TableIcon = iconByView.table;
  const CardIcon = iconByView.card;

  return (
    <div className={`flex justify-end w-full ${className}`.trim()}>
      <div className="inline-flex items-center gap-0.5 sm:gap-1 p-0.5 sm:p-1">
        <button type="button" onClick={() => onChange('table')} className={buttonClass('table')}>
          <TableIcon className="w-[12px] h-[12px] sm:w-[14px] sm:h-[14px]" />
        </button>
        <button type="button" onClick={() => onChange('card')} className={buttonClass('card')}>
          <CardIcon className="w-[12px] h-[12px] sm:w-[14px] sm:h-[14px]" />
        </button>
      </div>
    </div>
  );
}
