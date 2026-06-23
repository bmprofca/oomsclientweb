import React, { useState, useEffect, useCallback } from 'react';
import { PageContentSkeleton } from '../components/SkeletonComponent';
import {
  Receipt, Eye, TrendingUp, TrendingDown, Wallet, ArrowRightLeft, Download,
} from 'lucide-react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import ManagementHub from '../components/common/ManagementHub';
import ManagementTable from '../components/common/ManagementTable';
import AdvancedDateFilter from '../components/common/AdvancedDateFilter';
import SelectField from '../components/common/SelectField';
import Modal from '../components/common/Modal';
import Pagination, { usePagination } from '../components/common/PaginationComponent';
import { formatAmount } from '../utils/helpers';
import { apiCall } from '../utils/apiCall';
import toast from 'react-hot-toast';

// ── helpers ──────────────────────────────────────────────────────────────────

const TRANSACTION_TYPE_CONFIG = {
  sale: { label: 'Sale', color: 'text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800' },
  receive: { label: 'Receive', color: 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800' },
  payment: { label: 'Payment', color: 'text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800' },
  journal: { label: 'Journal', color: 'text-violet-700 bg-violet-50 dark:text-violet-400 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800' },
};

const getTypeConfig = (type) =>
  TRANSACTION_TYPE_CONFIG[type?.toLowerCase()] ?? {
    label: type ?? '—',
    color: 'text-slate-700 bg-slate-100 dark:text-slate-400 dark:bg-slate-800 border border-slate-200 dark:border-slate-700',
  };

function toIso(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const now = new Date();

const PRESETS = [
  {
    label: 'This Month',
    from: toIso(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: toIso(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  },
  {
    label: 'Last Month',
    from: toIso(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
    to: toIso(new Date(now.getFullYear(), now.getMonth(), 0)),
  },
  {
    label: 'This Qtr',
    from: toIso(new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)),
    to: toIso(new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0)),
  },
  {
    label: 'This Year',
    from: `${now.getFullYear()}-01-01`,
    to: `${now.getFullYear()}-12-31`,
  },
];

const DEFAULT_FROM = toIso(new Date(now.getFullYear(), now.getMonth(), 1));
const DEFAULT_TO = toIso(new Date(now.getFullYear(), now.getMonth() + 1, 0));

const TYPE_OPTIONS = [
  { value: 'sale', label: 'Sale' },
  { value: 'receive', label: 'Receive' },
  { value: 'payment', label: 'Payment' },
  { value: 'journal', label: 'Journal' },
];

const OPENING_BALANCE_ROW_ID = 'opening-balance-row';

function formatLedgerDate(date) {
  if (!date) return '—';
  const parsed = new Date(`${date}`.includes('T') ? date : `${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return '—';
  const day = String(parsed.getDate()).padStart(2, '0');
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${parsed.getFullYear()}`;
}

// ── component ─────────────────────────────────────────────────────────────────

export default function Ledger() {
  const { pagination, updatePagination, changeLimit, goToPage } = usePagination(1, 20);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [typeFilter, setTypeFilter] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // dateFilter shape: { from_date, to_date, date, month, year }
  // defaults to current month
  const [dateFilter, setDateFilter] = useState({
    from_date: DEFAULT_FROM,
    to_date: DEFAULT_TO,
    date: '', month: '', year: '',
  });

  const hasActiveFilters = typeFilter !== null ||
    dateFilter.from_date !== DEFAULT_FROM ||
    dateFilter.to_date !== DEFAULT_TO;

  const [transactions, setTransactions] = useState([]);
  const [openingBalance, setOpeningBalance] = useState({ debit: 0, credit: 0, balance: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Resolved date strings (fall back to current month defaults when cleared)
  const fromDate = dateFilter.from_date || DEFAULT_FROM;
  const toDate = dateFilter.to_date || DEFAULT_TO;

  const clearFilters = () => {
    setDateFilter({ from_date: DEFAULT_FROM, to_date: DEFAULT_TO, date: '', month: '', year: '' });
    setTypeFilter(null);
    goToPage(1);
  };

  // ── fetch ────────────────────────────────────────────────────────────────────

  const fetchTransactions = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setIsLoading(true);
    try {
      const typeQuery = typeFilter ? `&transaction_type=${typeFilter.value}` : '';
      const endpoint = `/transaction/list?page_no=${pagination.page}&limit=${pagination.limit}&from_date=${fromDate}&to_date=${toDate}${typeQuery}`;
      const response = await apiCall(endpoint, 'GET');
      const data = await response.json();
      if (response.ok && data.success !== false) {
        setTransactions(data.data || []);
        setOpeningBalance(data.opening_balance || { debit: 0, credit: 0, balance: 0 });
        if (data.pagination) updatePagination({ total: data.pagination.total });
      } else {
        setTransactions([]);
        updatePagination({ total: 0 });
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      toast.error('Failed to load transaction ledger');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, fromDate, toDate, typeFilter]);

  useEffect(() => {
    const t = setTimeout(() => fetchTransactions(), 300);
    return () => clearTimeout(t);
  }, [fetchTransactions]);

  // ── handlers ──────────────────────────────────────────────────────────────────

  const downloadInvoice = async (row) => {
    const loadingToast = toast.loading('Generating invoice PDF...');
    try {
      const response = await apiCall('/transaction/generate-invoice', 'POST', {
        invoice_id: row.invoice_id,
        type: row.transaction_type?.toLowerCase(),
      });
      const resData = await response.json();
      if (response.ok && resData.success && resData.data?.url) {
        toast.success(resData.message || 'Invoice PDF generated successfully', { id: loadingToast });
        
        const fileUrl = resData.data.url;
        const suggestedName = resData.data.suggested_filename || resData.data.filename || 'invoice.pdf';
        
        try {
          const fileRes = await fetch(fileUrl);
          const blob = await fileRes.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = suggestedName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
        } catch (corsErr) {
          const link = document.createElement('a');
          link.href = fileUrl;
          link.target = '_blank';
          link.download = suggestedName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else {
        toast.error(resData.message || 'Failed to generate invoice PDF', { id: loadingToast });
      }
    } catch (err) {
      console.error('Failed to download invoice:', err);
      toast.error('Failed to download invoice PDF', { id: loadingToast });
    }
  };

  const handleViewDetails = (item) => { setSelectedItem(item); setIsModalOpen(true); };

  const applyPreset = (preset) => {
    setDateFilter({ from_date: preset.from, to_date: preset.to, date: '', month: '', year: '' });
    goToPage(1);
  };

  const handleDateFilterChange = (val) => {
    setDateFilter({
      ...val,
      from_date: val.from_date || DEFAULT_FROM,
      to_date: val.to_date || DEFAULT_TO,
    });
    goToPage(1);
  };

  const shiftMonth = (delta) => {
    // Anchor to the start of the currently visible from-date month
    const base = new Date(`${fromDate}T00:00:00`);
    const newM = base.getMonth() + delta;
    const first = new Date(base.getFullYear(), newM, 1);
    const last = new Date(base.getFullYear(), newM + 1, 0);
    setDateFilter({ from_date: toIso(first), to_date: toIso(last), date: '', month: '', year: '' });
    goToPage(1);
  };

  // ── table columns ─────────────────────────────────────────────────────────────

  const tableColumns = [
    {
      key: 'transaction_date',
      label: 'Date',
      headerClassName: 'w-[140px]',
      className: 'w-[140px]',
      render: (row) => (
        row.isOpeningBalance
          ? <span className="font-bold text-amber-800 dark:text-amber-400">Opening Balance</span>
          : <span className="text-slate-600 dark:text-slate-400 font-medium">{formatLedgerDate(row.transaction_date)}</span>
      ),
    },
    {
      key: 'invoice_no',
      label: 'Invoice No.',
      headerClassName: 'w-[120px]',
      className: 'w-[120px]',
      render: (row) => (
        <span className="font-bold text-slate-800 dark:text-gray-100">
          {row.isOpeningBalance ? '' : (row.invoice_no || '—')}
        </span>
      ),
    },
    {
      key: 'transaction_type',
      label: 'Type',
      headerClassName: 'w-[95px]',
      className: 'w-[95px]',
      render: (row) => {
        if (row.isOpeningBalance) return null;
        const cfg = getTypeConfig(row.transaction_type);
        return <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider font-bold ${cfg.color}`}>{cfg.label}</span>;
      },
    },
    {
      key: 'debit',
      label: 'Debit',
      headerClassName: 'w-[125px] text-right',
      className: 'w-[125px] text-right',
      render: (row) => {
        const val = row.payment?.debit;
        return (
          <span className={`font-semibold tabular-nums ${val ? 'text-blue-600 dark:text-blue-400' : 'text-slate-300 dark:text-slate-600'} ${row.isOpeningBalance ? 'font-bold' : ''}`}>
            {val ? formatAmount(val) : '—'}
          </span>
        );
      },
    },
    {
      key: 'credit',
      label: 'Credit',
      headerClassName: 'w-[125px] text-right',
      className: 'w-[125px] text-right',
      render: (row) => {
        const val = row.payment?.credit;
        return (
          <span className={`font-semibold tabular-nums ${val ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-300 dark:text-slate-600'} ${row.isOpeningBalance ? 'font-bold' : ''}`}>
            {val ? formatAmount(val) : '—'}
          </span>
        );
      },
    },
    {
      key: 'balance',
      label: 'Balance',
      headerClassName: 'w-[135px] text-right pr-4 lg:pr-6',
      className: 'w-[135px] text-right pr-4 lg:pr-6',
      render: (row) => {
        const bal = row.payment?.balance ?? 0;
        return (
          <span className={`font-bold tabular-nums ${bal >= 0 ? 'text-slate-800 dark:text-gray-100' : 'text-rose-600 dark:text-rose-400'}`}>
            {formatAmount(bal)}
          </span>
        );
      },
    },
  ];

  const ledgerRows = [
    {
      transaction_id: OPENING_BALANCE_ROW_ID,
      isOpeningBalance: true,
      payment: {
        debit: openingBalance.debit || 0,
        credit: openingBalance.credit || 0,
        balance: openingBalance.balance || 0,
      },
    },
    ...transactions,
  ];

  const getRowActions = (row) => {
    if (row.isOpeningBalance) return [];
    const actions = [
      { id: 'view', label: 'View Details', icon: <Eye size={14} />, color: 'green', onClick: () => handleViewDetails(row) },
    ];
    if (row.invoice_id) {
      actions.push({
        id: 'download',
        label: 'Download Invoice',
        icon: <Download size={14} />,
        color: 'blue',
        onClick: () => downloadInvoice(row),
      });
    }
    return actions;
  };

  // ── render ────────────────────────────────────────────────────────────────────

  return (
    <ManagementHub
      title="Transaction Ledger"
      description="Sales, receipts, payments &amp; journal entries."
      accent="emerald"
      actions={null}
      onRefresh={() => fetchTransactions(true)}
      refreshing={refreshing}
      refreshLabel="Refresh"
      refreshTitle="Refresh ledger"
    >
      <div className="mt-4 flex flex-col gap-4">
        {/* Unified Filters Bar */}
        <div className="bg-white dark:bg-gray-800 p-2 sm:p-3 rounded-md border border-slate-200 dark:border-gray-700 flex flex-col lg:flex-row gap-3 lg:items-center justify-between shadow-sm">
          <div className="flex flex-col sm:flex-row flex-1 gap-2 sm:gap-3 w-full lg:w-auto items-stretch sm:items-center">
            
            {/* Date Shifter Input Group */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <button
                type="button"
                title="Previous month"
                onClick={() => shiftMonth(-1)}
                className="p-2 rounded-md border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 text-slate-500 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-300 dark:hover:border-emerald-700 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shrink-0"
              >
                <FaChevronLeft size={10} />
              </button>
              
              <div className="flex-1 sm:flex-none min-w-[200px]">
                <AdvancedDateFilter
                  value={dateFilter}
                  onChange={handleDateFilterChange}
                  placeholder="Date range…"
                  tabOptions={['range']}
                  buttonClassName="rounded-md border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 px-3 py-2 text-slate-700 dark:text-gray-200 hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors w-full text-xs sm:text-sm font-medium shadow-none"
                />
              </div>

              <button
                type="button"
                title="Next month"
                onClick={() => shiftMonth(1)}
                className="p-2 rounded-md border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 text-slate-500 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-300 dark:hover:border-emerald-700 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shrink-0"
              >
                <FaChevronRight size={10} />
              </button>
            </div>

            {/* Presets List */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
              {PRESETS.map((preset) => {
                const active = dateFilter.from_date === preset.from && dateFilter.to_date === preset.to;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all whitespace-nowrap ${active
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white dark:bg-gray-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-600 hover:text-emerald-700 dark:hover:text-emerald-400'
                      }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            <div className="hidden xl:block h-6 w-px bg-slate-200 dark:bg-gray-700 mx-1" />

            {/* Transaction Type Filter */}
            <div className="w-full sm:w-auto min-w-[150px]">
              <SelectField
                value={typeFilter}
                onChange={(val) => { setTypeFilter(val); goToPage(1); }}
                options={TYPE_OPTIONS}
                placeholder="All types"
                isClearable
              />
            </div>

            {/* Clear Filters Indicator */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="w-full sm:w-auto shrink-0 px-3 py-1.5 rounded-md text-xs font-semibold border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors whitespace-nowrap text-center"
              >
                ✕ Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Active range hint */}
        {(dateFilter.from_date && dateFilter.to_date) && (
          <p className="text-xs text-slate-400 dark:text-slate-500 leading-none px-1 -mt-2">
            Showing transactions from <span className="font-semibold text-slate-600 dark:text-slate-300">{formatLedgerDate(dateFilter.from_date)}</span> to <span className="font-semibold text-slate-600 dark:text-slate-300">{formatLedgerDate(dateFilter.to_date)}</span>
            {pagination.total > 0 && (
              <span className="ml-1.5 text-slate-300 dark:text-slate-600">
                • {pagination.total} transaction{pagination.total !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        )}

        {isLoading ? (
          <PageContentSkeleton columns={7} rows={8} />
        ) : (
          <>
            {/* Opening balance + transactions table using standard ManagementTable */}
            <ManagementTable
              columns={tableColumns}
              rows={ledgerRows}
              rowKey="transaction_id"
              accent="emerald"
              compact={false}
              responsive="scroll"
              showSerialNo={true}
              renderSerialNo={(row, index) => {
                if (row.isOpeningBalance) return '';
                return <span className="font-semibold text-slate-500 dark:text-slate-400">{index}</span>;
              }}
              getActions={getRowActions}
              activeId={activeMenuId}
              onToggleAction={(e, id) => setActiveMenuId(id)}
              rowClassName={(row) => row.isOpeningBalance ? 'bg-amber-50/40 dark:bg-amber-950/10 hover:bg-amber-50/50 dark:hover:bg-amber-950/20' : ''}
              onRowClick={(row) => !row.isOpeningBalance && handleViewDetails(row)}
            />

            {/* Empty state when no transactions (opening balance row still shows above) */}
            {transactions.length === 0 && (
              <div className="mt-3 bg-white dark:bg-gray-800 rounded-md border border-slate-200 dark:border-gray-700 p-8 text-center flex flex-col items-center justify-center shadow-sm">
                <ArrowRightLeft className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">No transactions found for this period</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Adjust date filters or clear the type filter to see results.</p>
              </div>
            )}

            {/* Pagination — only show when there are actual transactions */}
            {pagination.total > 0 && (
              <Pagination
                currentPage={pagination.page}
                totalItems={pagination.total}
                itemsPerPage={pagination.limit}
                onPageChange={goToPage}
                onLimitChange={changeLimit}
              />
            )}
          </>
        )}
      </div>

      {/* ── Modal ───────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Transaction Details"
        icon={Receipt}
        size="md"
        footer={
          selectedItem?.invoice_id ? (
            <button
              type="button"
              onClick={() => downloadInvoice(selectedItem)}
              className="flex items-center gap-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 shadow-sm transition-colors text-sm"
            >
              <Download size={15} />
              Download Invoice PDF
            </button>
          ) : null
        }
      >
        {selectedItem && (
          <div className="space-y-3 text-sm text-slate-700 dark:text-gray-300">
            {/* Header row */}
            <div className="flex justify-between items-start pb-3 border-b border-gray-100 dark:border-gray-700">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Invoice</p>
                <p className="text-base font-bold text-slate-900 dark:text-white leading-tight">{selectedItem.invoice_no || '—'}</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5 break-all">{selectedItem.transaction_id}</p>
              </div>
              <span className={`shrink-0 ml-3 mt-0.5 px-2.5 py-1 rounded-md text-xs font-bold ${getTypeConfig(selectedItem.transaction_type).color}`}>
                {getTypeConfig(selectedItem.transaction_type).label}
              </span>
            </div>

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Date</p>
                <p className="font-semibold text-slate-800 dark:text-gray-200">{formatLedgerDate(selectedItem.transaction_date)}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Invoice ID</p>
                <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 break-all">{selectedItem.invoice_id || '—'}</p>
              </div>
            </div>

            {/* Payment breakdown */}
            <div className="bg-slate-50 dark:bg-gray-900/60 rounded-md border border-slate-100 dark:border-gray-800 divide-y divide-slate-100 dark:divide-gray-800 overflow-hidden">
              {[
                { icon: <TrendingUp size={12} className="text-blue-500" />, label: 'Debit', val: formatAmount(selectedItem.payment?.debit ?? 0), cls: 'text-blue-700 dark:text-blue-400 font-semibold' },
                { icon: <TrendingDown size={12} className="text-emerald-500" />, label: 'Credit', val: formatAmount(selectedItem.payment?.credit ?? 0), cls: 'text-emerald-700 dark:text-emerald-400 font-semibold' },
                { icon: <Wallet size={12} className="text-amber-500" />, label: 'Running Balance', val: formatAmount(selectedItem.payment?.balance ?? 0), cls: `font-extrabold ${(selectedItem.payment?.balance ?? 0) >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'}` },
              ].map(({ icon, label, val, cls }) => (
                <div key={label} className="flex justify-between items-center px-3 py-2">
                  <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">{icon} {label}</span>
                  <span className={`tabular-nums ${cls}`}>{val}</span>
                </div>
              ))}
            </div>


          </div>
        )}
      </Modal>
    </ManagementHub>
  );
}
