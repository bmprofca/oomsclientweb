import React, { useState, useEffect, useCallback } from 'react';
import {
  Receipt, Eye, TrendingUp, TrendingDown, Wallet, ArrowRightLeft, RefreshCw,
} from 'lucide-react';
import { FaTh, FaListUl, FaSyncAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import ManagementHub from '../components/common/ManagementHub';
import ManagementTable from '../components/common/ManagementTable';
import ManagementCard from '../components/common/ManagementCard';
import ManagementGrid from '../components/common/ManagementGrid';
import AdvancedDateFilter from '../components/common/AdvancedDateFilter';
import SelectField from '../components/common/SelectField';
import Modal from '../components/common/Modal';
import Pagination, { usePagination } from '../components/common/PaginationComponent';
import { formatAmount, formatDate } from '../utils/helpers';
import { apiCall } from '../utils/apiCall';
import toast from 'react-hot-toast';

// ── helpers ──────────────────────────────────────────────────────────────────

const TRANSACTION_TYPE_CONFIG = {
  sale:    { label: 'Sale',    color: 'text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800' },
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
    to:   toIso(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  },
  {
    label: 'Last Month',
    from: toIso(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
    to:   toIso(new Date(now.getFullYear(), now.getMonth(), 0)),
  },
  {
    label: 'This Qtr',
    from: toIso(new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)),
    to:   toIso(new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0)),
  },
  {
    label: 'This Year',
    from: `${now.getFullYear()}-01-01`,
    to:   `${now.getFullYear()}-12-31`,
  },
];

const DEFAULT_FROM = `${now.getFullYear()}-01-01`;
const DEFAULT_TO   = toIso(now);

const TYPE_OPTIONS = [
  { value: 'sale',    label: 'Sale' },
  { value: 'receive', label: 'Receive' },
  { value: 'payment', label: 'Payment' },
  { value: 'journal', label: 'Journal' },
];

// ── Stat card — matches Dashboard style ──────────────────────────────────────

function StatCard({ label, value, valueClass, iconBg, Icon, subtext }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between min-w-0">
      <div className="flex justify-between items-start">
        <div className="min-w-0 flex-1">
          <h3 className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider truncate">
            {label}
          </h3>
          <p className={`text-xl font-bold mt-1.5 tabular-nums truncate ${valueClass}`}>
            {value}
          </p>
        </div>
        <div className={`ml-3 shrink-0 p-2.5 rounded-xl ${iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      {subtext && (
        <p className="mt-2 text-[10px] text-gray-400 dark:text-gray-500 truncate">{subtext}</p>
      )}
    </div>
  );
}

// ── Compact view toggle ───────────────────────────────────────────────────────

function ViewToggle({ viewMode, onChange }) {
  const btn = (mode, Icon, title) => (
    <button
      type="button"
      title={title}
      onClick={() => onChange(mode)}
      className={`p-1.5 rounded-md transition-colors ${
        viewMode === mode
          ? 'bg-blue-600 text-white shadow-sm'
          : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
      }`}
    >
      <Icon size={13} />
    </button>
  );
  return (
    <div className="flex items-center gap-0.5 p-0.5 rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      {btn('table', FaListUl, 'Table view')}
      {btn('card',  FaTh,     'Card view')}
    </div>
  );
}

// ── component ─────────────────────────────────────────────────────────────────

export default function Ledger() {
  const [viewMode, setViewMode] = useState('table');
  const { pagination, updatePagination, changeLimit, goToPage } = usePagination(1, 20);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [typeFilter, setTypeFilter]     = useState(null);
  const [refreshing, setRefreshing]     = useState(false);

  // dateFilter shape: { from_date, to_date, date, month, year }
  const [dateFilter, setDateFilter] = useState({
    from_date: DEFAULT_FROM,
    to_date:   DEFAULT_TO,
    date: '', month: '', year: '',
  });

  const [transactions, setTransactions]     = useState([]);
  const [openingBalance, setOpeningBalance] = useState({ debit: 0, credit: 0, balance: 0 });
  const [isLoading, setIsLoading]           = useState(true);
  const [isModalOpen, setIsModalOpen]       = useState(false);
  const [selectedItem, setSelectedItem]     = useState(null);

  // Resolved date strings (fall back to defaults when cleared)
  const fromDate = dateFilter.from_date || DEFAULT_FROM;
  const toDate   = dateFilter.to_date   || DEFAULT_TO;

  // ── fetch ────────────────────────────────────────────────────────────────────

  const fetchTransactions = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setIsLoading(true);
    try {
      const typeQuery = typeFilter ? `&transaction_type=${typeFilter.value}` : '';
      const endpoint  = `/transaction/list?page_no=${pagination.page}&limit=${pagination.limit}&from_date=${fromDate}&to_date=${toDate}${typeQuery}`;
      const response  = await apiCall(endpoint, 'GET');
      const data      = await response.json();
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

  // ── computed ──────────────────────────────────────────────────────────────────

  const totalDebit     = transactions.reduce((a, t) => a + (t.payment?.debit  || 0), 0);
  const totalCredit    = transactions.reduce((a, t) => a + (t.payment?.credit || 0), 0);
  const closingBalance = transactions.length > 0
    ? transactions[transactions.length - 1].payment?.balance ?? openingBalance.balance
    : openingBalance.balance;

  // ── handlers ──────────────────────────────────────────────────────────────────

  const handleViewDetails = (item) => { setSelectedItem(item); setIsModalOpen(true); };

  const applyPreset = (preset) => {
    setDateFilter({ from_date: preset.from, to_date: preset.to, date: '', month: '', year: '' });
    goToPage(1);
  };

  /**
   * Called by AdvancedDateFilter onChange.
   * When the user clears (from_date / to_date become ""), fall back to defaults
   * so the API always gets a valid range and the trigger label stays sensible.
   */
  const handleDateFilterChange = (val) => {
    const resolved = {
      ...val,
      from_date: val.from_date || DEFAULT_FROM,
      to_date:   val.to_date   || DEFAULT_TO,
    };
    setDateFilter(resolved);
    goToPage(1);
  };

  /**
   * Shift the current date range by N whole months.
   * from_date -> first day of target month, to_date -> last day of target month.
   */
  const shiftMonth = (delta) => {
    const base  = new Date(fromDate + 'T00:00:00');
    const newY  = base.getFullYear();
    const newM  = base.getMonth() + delta; // can overflow — Date handles it
    const first = new Date(newY, newM, 1);
    const last  = new Date(newY, newM + 1, 0);
    const from  = toIso(first);
    const to    = toIso(last);
    setDateFilter({ from_date: from, to_date: to, date: '', month: '', year: '' });
    goToPage(1);
  };

  // ── table columns ─────────────────────────────────────────────────────────────

  const tableColumns = [
    {
      key: 'invoice_no',
      label: 'Invoice No.',
      render: (row) => <span className="font-bold text-slate-800 dark:text-gray-100">{row.invoice_no}</span>,
    },
    {
      key: 'transaction_date',
      label: 'Date',
      render: (row) => <span className="text-slate-600 dark:text-slate-400">{formatDate(row.transaction_date)}</span>,
    },
    {
      key: 'transaction_type',
      label: 'Type',
      render: (row) => {
        const cfg = getTypeConfig(row.transaction_type);
        return <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${cfg.color}`}>{cfg.label}</span>;
      },
    },
    {
      key: 'debit',
      label: 'Debit (₹)',
      render: (row) => (
        <span className={`font-medium tabular-nums ${row.payment?.debit ? 'text-blue-700 dark:text-blue-400' : 'text-slate-300 dark:text-slate-600'}`}>
          {row.payment?.debit ? formatAmount(row.payment.debit) : '—'}
        </span>
      ),
    },
    {
      key: 'credit',
      label: 'Credit (₹)',
      render: (row) => (
        <span className={`font-medium tabular-nums ${row.payment?.credit ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-300 dark:text-slate-600'}`}>
          {row.payment?.credit ? formatAmount(row.payment.credit) : '—'}
        </span>
      ),
    },
    {
      key: 'balance',
      label: 'Balance (₹)',
      render: (row) => {
        const bal = row.payment?.balance ?? 0;
        return (
          <span className={`font-bold tabular-nums ${bal >= 0 ? 'text-slate-800 dark:text-gray-100' : 'text-red-600 dark:text-red-400'}`}>
            {formatAmount(bal)}
          </span>
        );
      },
    },
  ];

  const getRowActions = (row) => [
    { id: 'view', label: 'View Details', icon: <Eye size={14} />, color: 'green', onClick: () => handleViewDetails(row) },
  ];

  // ── Summary — 4 stat cards matching Dashboard style ───────────────────────────

  const summary = (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full">
      <StatCard
        label="Opening Balance"
        value={formatAmount(openingBalance.balance)}
        valueClass={openingBalance.balance >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-600 dark:text-red-400'}
        iconBg="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300"
        Icon={Wallet}
        subtext="Balance carried forward"
      />
      <StatCard
        label="Total Debit"
        value={formatAmount(totalDebit)}
        valueClass="text-blue-700 dark:text-blue-400"
        iconBg="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
        Icon={TrendingUp}
        subtext="Billed in this period"
      />
      <StatCard
        label="Total Credit"
        value={formatAmount(totalCredit)}
        valueClass="text-emerald-700 dark:text-emerald-400"
        iconBg="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
        Icon={TrendingDown}
        subtext="Received in this period"
      />
      <StatCard
        label="Closing Balance"
        value={formatAmount(closingBalance)}
        valueClass={closingBalance >= 0 ? 'text-amber-700 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}
        iconBg="bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
        Icon={Wallet}
        subtext={closingBalance >= 0 ? 'Net receivable' : 'Net payable'}
      />
    </div>
  );

  // ── render ────────────────────────────────────────────────────────────────────

  return (
    <ManagementHub
      eyebrow="Financial ledger"
      title="Transaction Ledger"
      description="Sales, receipts, payments &amp; journal entries."
      accent="emerald"
      summary={summary}
      actions={null}
      onRefresh={undefined}
    >
      {/* ── Controls bar ───────────────────────────────────────────────────── */}
      <div className="mt-3 mb-3 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 px-3 py-2.5 shadow-sm">

        {/* Single row: [‹] [date picker] [›] · presets · | · type · view · refresh */}
        <div className="flex flex-wrap items-center gap-2">

          {/* ← Prev month */}
          <button
            type="button"
            title="Previous month"
            onClick={() => shiftMonth(-1)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 text-slate-500 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-300 dark:hover:border-emerald-700 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shrink-0"
          >
            <FaChevronLeft size={11} />
          </button>

          {/* Calendar range picker */}
          <div className="shrink-0" style={{ minWidth: 195, maxWidth: 270 }}>
            <AdvancedDateFilter
              value={dateFilter}
              onChange={handleDateFilterChange}
              placeholder="Date range…"
              tabOptions={['range']}
              buttonClassName="rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 px-2.5 py-1.5 text-slate-700 dark:text-gray-200 hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors w-full text-xs"
            />
          </div>

          {/* → Next month */}
          <button
            type="button"
            title="Next month"
            onClick={() => shiftMonth(1)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 text-slate-500 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-300 dark:hover:border-emerald-700 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shrink-0"
          >
            <FaChevronRight size={11} />
          </button>

          {/* Preset chips */}
          <div className="flex items-center gap-1 flex-wrap">
            {PRESETS.map((preset) => {
              const active = dateFilter.from_date === preset.from && dateFilter.to_date === preset.to;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all whitespace-nowrap ${
                    active
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white dark:bg-gray-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-600 hover:text-emerald-700 dark:hover:text-emerald-400'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {/* Visual divider */}
          <div className="hidden sm:block h-5 w-px bg-slate-200 dark:bg-gray-700 mx-0.5" />

          {/* Type filter */}
          <div style={{ minWidth: 140 }}>
            <SelectField
              value={typeFilter}
              onChange={(val) => { setTypeFilter(val); goToPage(1); }}
              options={TYPE_OPTIONS}
              placeholder="All types"
              isClearable
            />
          </div>

          {/* View toggle + Refresh — pushed to end */}
          <div className="ml-auto flex items-center gap-2">
            <ViewToggle viewMode={viewMode} onChange={setViewMode} />

            <button
              type="button"
              onClick={() => fetchTransactions(true)}
              disabled={refreshing}
              title="Refresh ledger"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-gray-700 hover:text-slate-800 dark:hover:text-white transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              <FaSyncAlt size={11} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Active range hint */}
        {(dateFilter.from_date && dateFilter.to_date) && (
          <p className="mt-1.5 text-[10px] text-slate-400 dark:text-slate-500 leading-none">
            Showing: <span className="font-medium text-slate-500 dark:text-slate-400">{formatDate(dateFilter.from_date)}</span>
            {' – '}
            <span className="font-medium text-slate-500 dark:text-slate-400">{formatDate(dateFilter.to_date)}</span>
            {pagination.total > 0 && (
              <span className="ml-2 text-slate-300 dark:text-slate-600">
                · {pagination.total} transaction{pagination.total !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        )}
      </div>

      {/* ── Table / Grid / Loading / Empty ─────────────────────────────────── */}
      {isLoading ? (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-emerald-500" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 py-10 text-center flex flex-col items-center">
          <ArrowRightLeft className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">No transactions in this period</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Adjust the date range or clear the type filter</p>
        </div>
      ) : viewMode === 'table' ? (
        <ManagementTable
          columns={tableColumns}
          rows={transactions}
          rowKey="transaction_id"
          accent="emerald"
          getActions={getRowActions}
          activeId={activeMenuId}
          onToggleAction={(e, id) => setActiveMenuId(id)}
          onRowClick={(row) => handleViewDetails(row)}
        />
      ) : (
        <ManagementGrid viewMode={viewMode}>
          {transactions.map((txn) => {
            const cfg = getTypeConfig(txn.transaction_type);
            return (
              <ManagementCard
                key={txn.transaction_id}
                title={txn.invoice_no}
                subtitle={formatDate(txn.transaction_date)}
                accent="emerald"
                icon={<Receipt size={15} />}
                badge={
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${cfg.color}`}>
                    {cfg.label}
                  </span>
                }
                actions={getRowActions(txn)}
                menuId={`menu-${txn.transaction_id}`}
                activeId={activeMenuId}
                onToggle={(e, id) => setActiveMenuId(id)}
                onClick={() => handleViewDetails(txn)}
              >
                <div className="mt-2 grid grid-cols-3 gap-1 text-xs border-t border-slate-100 dark:border-gray-700 pt-1.5">
                  {[
                    { lbl: 'Debit',   val: txn.payment?.debit   ? formatAmount(txn.payment.debit)   : '—', cls: 'text-blue-700 dark:text-blue-400' },
                    { lbl: 'Credit',  val: txn.payment?.credit  ? formatAmount(txn.payment.credit)  : '—', cls: 'text-emerald-700 dark:text-emerald-400' },
                    { lbl: 'Balance', val: formatAmount(txn.payment?.balance ?? 0),                         cls: (txn.payment?.balance ?? 0) >= 0 ? 'text-slate-700 dark:text-gray-200' : 'text-red-600 dark:text-red-400' },
                  ].map(({ lbl, val, cls }) => (
                    <div key={lbl}>
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider">{lbl}</p>
                      <p className={`font-bold tabular-nums text-[11px] ${cls}`}>{val}</p>
                    </div>
                  ))}
                </div>
              </ManagementCard>
            );
          })}
        </ManagementGrid>
      )}

      <Pagination
        currentPage={pagination.page}
        totalItems={pagination.total}
        itemsPerPage={pagination.limit}
        onPageChange={goToPage}
        onLimitChange={changeLimit}
      />

      {/* ── Modal ───────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Transaction Details"
        icon={Receipt}
        size="md"
        confirmText="Close"
        onConfirm={() => setIsModalOpen(false)}
      >
        {selectedItem && (
          <div className="space-y-3 text-sm text-slate-700 dark:text-gray-300">
            {/* Header row */}
            <div className="flex justify-between items-start pb-3 border-b border-gray-100 dark:border-gray-700">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Invoice</p>
                <p className="text-base font-bold text-slate-900 dark:text-white leading-tight">{selectedItem.invoice_no}</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5 break-all">{selectedItem.transaction_id}</p>
              </div>
              <span className={`shrink-0 ml-3 mt-0.5 px-2.5 py-1 rounded text-xs font-bold ${getTypeConfig(selectedItem.transaction_type).color}`}>
                {getTypeConfig(selectedItem.transaction_type).label}
              </span>
            </div>

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Date</p>
                <p className="font-semibold text-slate-800 dark:text-gray-200">{formatDate(selectedItem.transaction_date)}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Invoice ID</p>
                <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 break-all">{selectedItem.invoice_id}</p>
              </div>
            </div>

            {/* Payment breakdown */}
            <div className="bg-slate-50 dark:bg-gray-900/60 rounded-lg border border-slate-100 dark:border-gray-800 divide-y divide-slate-100 dark:divide-gray-800 overflow-hidden">
              {[
                { icon: <TrendingUp  size={12} className="text-blue-500"    />, label: 'Debit',           val: formatAmount(selectedItem.payment?.debit   ?? 0), cls: 'text-blue-700 dark:text-blue-400 font-semibold' },
                { icon: <TrendingDown size={12} className="text-emerald-500" />, label: 'Credit',          val: formatAmount(selectedItem.payment?.credit  ?? 0), cls: 'text-emerald-700 dark:text-emerald-400 font-semibold' },
                { icon: <Wallet       size={12} className="text-amber-500"   />, label: 'Running Balance', val: formatAmount(selectedItem.payment?.balance ?? 0), cls: `font-extrabold ${(selectedItem.payment?.balance ?? 0) >= 0 ? 'text-slate-900 dark:text-white' : 'text-red-600 dark:text-red-400'}` },
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
