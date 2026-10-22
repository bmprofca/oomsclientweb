import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Bell, CheckCheck, CheckCircle, Info, RefreshCw, Trash2 } from 'lucide-react';
import ManagementHub from '../components/common/ManagementHub';
import ManagementFilters from '../components/common/ManagementFilters';
import Pagination, { usePagination } from '../components/common/PaginationComponent';
import { useToast } from '../contexts/ToastContext';
import { apiCall } from '../utils/apiCall';
import { CATEGORY_OPTIONS, normalizeNotification } from '../utils/notification-utils';

function iconForCategory(category) {
  if (category === 'compliance' || category === 'billing') return <AlertCircle className="h-5 w-5 text-amber-500" />;
  if (category === 'task' || category === 'document') return <CheckCircle className="h-5 w-5 text-emerald-500" />;
  return <Info className="h-5 w-5 text-blue-500" />;
}

export default function Notification() {
  const showToast = useToast();
  const { pagination, updatePagination, changeLimit, goToPage } = usePagination(1, 10);
  const [notifications, setNotifications] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [listResponse, countResponse] = await Promise.all([
        apiCall('/notifications?limit=100&include_read=true', 'GET'),
        apiCall('/notifications/unread-count', 'GET'),
      ]);
      const listPayload = await listResponse.json().catch(() => null);
      const countPayload = await countResponse.json().catch(() => null);
      if (!listResponse.ok || listPayload?.success === false) throw new Error(listPayload?.message || 'Unable to load notifications');
      const rows = Array.isArray(listPayload?.data) ? listPayload.data.map(normalizeNotification) : [];
      setNotifications(rows);
      setUnreadCount(Number(countPayload?.data?.unread_count ?? rows.filter(item => !item.isRead).length));
      updatePagination({ total: rows.length });
    } catch (requestError) {
      setError(requestError.message || 'Unable to load notifications.');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [updatePagination]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const filteredNotifications = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return notifications.filter((item) => {
      const matchesCategory = categoryFilter ? item.category === categoryFilter.value : true;
      const matchesQuery = !query || `${item.title} ${item.message}`.toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  }, [categoryFilter, notifications, searchQuery]);

  useEffect(() => { updatePagination({ total: filteredNotifications.length }); }, [filteredNotifications.length, updatePagination]);

  const currentNotifications = filteredNotifications.slice((pagination.page - 1) * pagination.limit, pagination.page * pagination.limit);

  const markRead = async (notification) => {
    if (notification.isRead) return;
    setBusyId(notification.id);
    try {
      const response = await apiCall('/notifications/read', 'POST', { notification_ids: [notification.id] });
      const payload = await response.json().catch(() => null);
      if (!response.ok || payload?.success === false) throw new Error(payload?.message || 'Unable to mark notification as read');
      setNotifications(items => items.map(item => item.id === notification.id ? { ...item, isRead: true } : item));
      setUnreadCount(count => Math.max(0, count - 1));
    } catch (requestError) {
      showToast.error(requestError.message || 'Unable to mark notification as read');
    } finally { setBusyId(null); }
  };

  const markAllRead = async () => {
    setBusyId('all-read');
    try {
      const response = await apiCall('/notifications/read', 'POST', { mark_all: true });
      const payload = await response.json().catch(() => null);
      if (!response.ok || payload?.success === false) throw new Error(payload?.message || 'Unable to mark notifications as read');
      setNotifications(items => items.map(item => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch (requestError) {
      showToast.error(requestError.message || 'Unable to mark notifications as read');
    } finally { setBusyId(null); }
  };

  const deleteNotification = async (notification) => {
    setBusyId(notification.id);
    try {
      const response = await apiCall('/notifications/delete', 'POST', { notification_ids: [notification.id] });
      const payload = await response.json().catch(() => null);
      if (!response.ok || payload?.success === false) throw new Error(payload?.message || 'Unable to delete notification');
      setNotifications(items => items.filter(item => item.id !== notification.id));
      if (!notification.isRead) setUnreadCount(count => Math.max(0, count - 1));
    } catch (requestError) {
      showToast.error(requestError.message || 'Unable to delete notification');
    } finally { setBusyId(null); }
  };

  return (
    <ManagementHub
      title="Notifications"
      description="Branch-scoped task, document, billing, and compliance updates."
      accent="indigo"
      onRefresh={fetchNotifications}
      actions={(
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">{unreadCount} unread</span>
          <button type="button" onClick={markAllRead} disabled={busyId === 'all-read' || unreadCount === 0} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
            <CheckCheck size={14} /> Mark all read
          </button>
        </div>
      )}
    >
      <div className="mt-4 space-y-3">
        <ManagementFilters searchValue={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder="Search notifications..." filters={[{ value: categoryFilter, onChange: setCategoryFilter, options: CATEGORY_OPTIONS, placeholder: 'Filter category', isClearable: true }]} />
        {error && <div role="alert" className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300"><AlertCircle size={16} /> {error}<button type="button" onClick={fetchNotifications} className="ml-auto inline-flex items-center gap-1 font-semibold hover:underline"><RefreshCw size={14} /> Retry</button></div>}
        {loading ? (
          <div className="rounded-md border border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-gray-700 dark:text-gray-400">Loading notifications…</div>
        ) : currentNotifications.length === 0 ? (
          <div className="rounded-md border border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-gray-700 dark:text-gray-400">No notifications found.</div>
        ) : (
          <div className="space-y-2">
            {currentNotifications.map(notification => (
              <article key={notification.id} className={`flex items-start gap-3 rounded-md border p-4 transition-colors ${notification.isRead ? 'border-slate-200 bg-white dark:border-gray-700 dark:bg-gray-800' : 'border-indigo-200 bg-indigo-50/60 dark:border-indigo-900/60 dark:bg-indigo-950/20'}`}>
                <div className="mt-0.5 shrink-0">{notification.isRead ? <Bell className="h-5 w-5 text-slate-400" /> : iconForCategory(notification.category)}</div>
                <button type="button" onClick={() => markRead(notification)} disabled={busyId === notification.id} className="min-w-0 flex-1 text-left">
                  <div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-bold text-slate-800 dark:text-white">{notification.title}</h3><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:bg-gray-700 dark:text-gray-300">{notification.category}</span>{!notification.isRead && <span className="h-2 w-2 rounded-full bg-indigo-600" aria-label="Unread" />}</div>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-gray-300">{notification.message}</p>
                  <time className="mt-2 block text-xs text-slate-400" dateTime={notification.createdAt}>{notification.createdAt ? new Date(notification.createdAt).toLocaleString('en-IN') : 'Date unavailable'}</time>
                </button>
                <button type="button" onClick={() => deleteNotification(notification)} disabled={busyId === notification.id} aria-label={`Delete ${notification.title}`} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950/30"><Trash2 size={16} /></button>
              </article>
            ))}
          </div>
        )}
        <Pagination currentPage={pagination.page} totalItems={pagination.total} itemsPerPage={pagination.limit} onPageChange={goToPage} onLimitChange={changeLimit} />
      </div>
    </ManagementHub>
  );
}
