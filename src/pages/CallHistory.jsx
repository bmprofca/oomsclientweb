import React, { useEffect, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Clock3,
  PhoneCall,
  RefreshCw,
} from 'lucide-react';
import { voiceCallApi } from '../services/voiceCallApi';

const PAGE_SIZE = 25;

const STATUS_LABELS = {
  ringing: 'Ringing',
  accepted: 'In progress',
  rejected: 'Declined',
  cancelled: 'Cancelled',
  missed: 'Missed',
  ended: 'Completed',
  failed: 'Failed',
};

const STATUS_STYLES = {
  ringing: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/25 dark:text-amber-300 dark:border-amber-800',
  accepted: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/25 dark:text-blue-300 dark:border-blue-800',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/25 dark:text-rose-300 dark:border-rose-800',
  cancelled: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  missed: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/25 dark:text-rose-300 dark:border-rose-800',
  ended: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/25 dark:text-emerald-300 dark:border-emerald-800',
  failed: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/25 dark:text-rose-300 dark:border-rose-800',
};

function formatCallDate(value) {
  if (!value) return 'Date unavailable';
  const date = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function formatDuration(value) {
  if (value == null) return '—';
  const seconds = Math.max(0, Number(value));
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
}

function CallHistoryRow({ call }) {
  const incoming = call.direction === 'incoming';
  const DirectionIcon = incoming ? ArrowDownLeft : ArrowUpRight;
  return (
    <article className="grid gap-3 border-b border-slate-100 px-4 py-4 last:border-b-0 dark:border-slate-800 sm:px-5 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.1fr)_110px] md:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${incoming ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
          <DirectionIcon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{call.other_participant_name || 'OOMS team member'}</p>
          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{call.other_participant_username || 'Team member'}</p>
        </div>
      </div>
      <div className="min-w-0 pl-[52px] md:pl-0">
        <p className="truncate text-sm text-slate-700 dark:text-slate-200">{call.branch_name || call.branch_id || 'Branch unavailable'}</p>
        <p className="mt-0.5 text-xs capitalize text-slate-500 dark:text-slate-400">{call.direction} call</p>
      </div>
      <div className="pl-[52px] md:pl-0">
        <p className="text-sm text-slate-700 dark:text-slate-200">{formatCallDate(call.create_date)}</p>
        <span className={`mt-1 inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLES[call.status] || STATUS_STYLES.cancelled}`}>
          {STATUS_LABELS[call.status] || call.status}
        </span>
      </div>
      <div className="flex items-center gap-1.5 pl-[52px] text-xs font-medium text-slate-600 dark:text-slate-300 md:justify-end md:pl-0">
        <Clock3 className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
        {formatDuration(call.duration_seconds)}
      </div>
    </article>
  );
}

export default function CallHistory() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, total_pages: 1 });
  const [direction, setDirection] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    voiceCallApi.getHistory({
      page: pagination.page,
      limit: PAGE_SIZE,
      direction: direction || undefined,
      status: status || undefined,
    })
      .then((response) => {
        if (!active) return;
        const data = response?.data || {};
        setItems(Array.isArray(data.items) ? data.items : []);
        setPagination(data.pagination || { page: 1, total: 0, total_pages: 1 });
      })
      .catch((requestError) => {
        if (active) setError(requestError?.message || 'Could not load your call history.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [direction, pagination.page, refreshKey, status]);

  const updateFilter = (setter) => (event) => {
    setter(event.target.value);
    setPagination((current) => ({ ...current, page: 1 }));
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] px-2 py-3 sm:px-4 sm:py-5">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <p className="text-xs font-semibold uppercase text-teal-700 dark:text-teal-300">OOMS calls</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Call history</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Review calls with your assigned team.</p>
        </div>
        <button
          type="button"
          onClick={() => setRefreshKey((current) => current + 1)}
          disabled={loading}
          className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          Refresh
        </button>
      </header>

      <section className="mt-4 flex flex-wrap items-end justify-between gap-4" aria-label="Call history filters">
        <div className="flex flex-wrap gap-3">
          <label className="grid gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
            Direction
            <select value={direction} onChange={updateFilter(setDirection)} className="h-10 min-w-36 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 outline-none focus:border-teal-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
              <option value="">All directions</option>
              <option value="incoming">Incoming</option>
              <option value="outgoing">Outgoing</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
            Outcome
            <select value={status} onChange={updateFilter(setStatus)} className="h-10 min-w-36 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 outline-none focus:border-teal-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
              <option value="">All outcomes</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {pagination.total} {pagination.total === 1 ? 'call' : 'calls'}
        </p>
      </section>

      <section className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" aria-label="Call records">
        <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.1fr)_110px] gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3 text-[11px] font-bold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400 md:grid">
          <span>Team member</span><span>Branch and direction</span><span>When and outcome</span><span className="text-right">Duration</span>
        </div>
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-500 dark:text-slate-400" role="status">Loading call history...</div>
        ) : error ? (
          <div className="px-5 py-12 text-center" role="alert">
            <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">{error}</p>
            <button type="button" onClick={() => setRefreshKey((current) => current + 1)} className="mt-3 text-sm font-semibold text-teal-700 hover:underline dark:text-teal-300">Try again</button>
          </div>
        ) : items.length ? (
          items.map((call) => <CallHistoryRow key={call.call_id} call={call} />)
        ) : (
          <div className="px-5 py-16 text-center">
            <PhoneCall className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
            <h2 className="mt-3 text-base font-semibold text-slate-800 dark:text-slate-100">No calls found</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Calls with your team will appear here.</p>
          </div>
        )}
      </section>

      <footer className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500 dark:text-slate-400">Page {pagination.page} of {pagination.total_pages}</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => setPagination((current) => ({ ...current, page: current.page - 1 }))} disabled={loading || pagination.page <= 1} aria-label="Previous page" className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))} disabled={loading || pagination.page >= pagination.total_pages} aria-label="Next page" className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </footer>
    </div>
  );
}