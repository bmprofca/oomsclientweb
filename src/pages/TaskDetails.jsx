import React, { useState, useEffect, useRef } from 'react';
import { DetailSkeleton } from '../components/SkeletonComponent';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckSquare, ArrowLeft, Building2, Wrench, IndianRupee,
  CalendarDays, Clock, Upload, Users, Receipt,
  BadgeCheck, AlertCircle, Loader2, FileText, Tag,
  History, X, User, Mail, Phone, RefreshCw
} from 'lucide-react';
import { apiCall } from '../utils/apiCall';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';

// ── helpers ────────────────────────────────────────────────────────────────────

const formatDate = (str) => {
  if (!str) return '—';
  const d = new Date(str);
  return isNaN(d) ? str : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDateTime = (str) => {
  if (!str) return '—';
  const d = new Date(str);
  return isNaN(d) ? str : d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const firmTypeLabel = (type) => {
  if (!type) return '—';
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const StatusBadge = ({ status }) => {
  const s = status?.toLowerCase() || '';
  let cls = 'text-slate-700 bg-slate-100 border-slate-200 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700';
  if (s.includes('complete')) cls = 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-900/30 dark:border-emerald-800';
  else if (s.includes('pending')) cls = 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-900/30 dark:border-amber-800';
  else if (s.includes('progress')) cls = 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/30 dark:border-blue-800';
  else if (s.includes('cancel')) cls = 'text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/30 dark:border-red-800';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide border ${cls}`}>
      {status || 'Unknown'}
    </span>
  );
};

/** Returns the dot colour class for a status string */
const dotColor = (status = '') => {
  const s = status.toLowerCase();
  if (s.includes('complete')) return 'bg-emerald-500 ring-emerald-100 dark:ring-emerald-900/40';
  if (s.includes('pending')) return 'bg-amber-500  ring-amber-100  dark:ring-amber-900/40';
  if (s.includes('progress')) return 'bg-blue-500   ring-blue-100   dark:ring-blue-900/40';
  if (s.includes('cancel')) return 'bg-red-500    ring-red-100    dark:ring-red-900/40';
  return 'bg-slate-400 ring-slate-100 dark:ring-slate-700';
};

const InfoRow = ({ label, value, icon: Icon }) => (
  <div className="flex items-start gap-3 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
    {Icon && (
      <div className="mt-0.5 shrink-0 p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
        <Icon size={13} />
      </div>
    )}
    <div className="flex-1 min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-800 dark:text-slate-200 break-words">{value ?? '—'}</p>
    </div>
  </div>
);

const Section = ({ title, icon: Icon, accent = 'amber', children }) => {
  const accents = {
    amber: 'border-amber-400 text-amber-600 dark:text-amber-400',
    indigo: 'border-indigo-400 text-indigo-600 dark:text-indigo-400',
    emerald: 'border-emerald-400 text-emerald-600 dark:text-emerald-400',
    slate: 'border-slate-400 text-slate-500 dark:text-slate-400',
  };
  return (
    <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      <div className={`flex items-center gap-2 px-5 py-3.5 border-b-2 ${accents[accent]} border-opacity-60 bg-slate-50/60 dark:bg-slate-800/40`}>
        {Icon && <Icon size={15} className={accents[accent].split(' ')[1]} />}
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 tracking-tight">{title}</h3>
      </div>
      <div className="px-5 py-1">{children}</div>
    </div>
  );
};

// ── Status Log Modal ────────────────────────────────────────────────────────────

function StatusLogModal({ isOpen, onClose, logs = [] }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="relative z-10 w-full max-w-md flex flex-col rounded-xl shadow-2xl bg-white dark:bg-slate-900 overflow-hidden"
            style={{ maxHeight: '85vh' }}
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          >
            {/* Header */}
            <div className="shrink-0">
              <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-400" />
              <div className="flex items-center justify-between px-5 py-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2.5">
                  <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/40">
                    <History size={16} className="text-amber-600 dark:text-amber-400" />
                  </span>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Status History</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">{logs.length} event{logs.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Timeline body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-5">
              {logs.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-slate-400">
                  <History size={36} className="opacity-25" />
                  <p className="text-sm font-medium">No status history yet</p>
                </div>
              ) : (
                <ol className="relative">
                  {logs.map((log, idx) => {
                    const isLast = idx === logs.length - 1;
                    const by = log.create_by || {};
                    return (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.06 }}
                        className="relative pl-8 pb-6 last:pb-0"
                      >
                        {/* Vertical line */}
                        {!isLast && (
                          <div className="absolute left-[11px] top-5 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />
                        )}

                        {/* Dot */}
                        <span
                          className={`absolute left-0 top-1.5 h-[22px] w-[22px] rounded-full ring-4 flex items-center justify-center ${dotColor(log.status)}`}
                        >
                          <span className="h-2 w-2 rounded-full bg-white opacity-80" />
                        </span>

                        {/* Content card */}
                        <div className="ml-1 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-3 space-y-2">
                          {/* Status + date */}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <StatusBadge status={log.status} />
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                              {formatDateTime(log.create_date)}
                            </span>
                          </div>

                          {/* Who changed it */}
                          {by.name && (
                            <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-700">
                              <div className="h-6 w-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                                {by.name[0].toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{by.name}</p>
                                {by.mobile && (
                                  <p className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-0.5">
                                    <Phone size={9} /> {by.country_code ? `+${by.country_code} ` : ''}{by.mobile}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.li>
                    );
                  })}
                </ol>
              )}
            </div>

            {/* Footer */}
            <div className="shrink-0 flex justify-end px-5 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── main component ─────────────────────────────────────────────────────────────

export default function TaskDetails() {
  const { task_id } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showStatusLog, setShowStatusLog] = useState(false);

  const fetchedTaskIdRef = useRef(null);

  const fetchDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiCall(`/task/details/${task_id}`, 'GET');
      const data = await response.json();
      if (response.ok && data.success !== false) {
        setTask(data.data);
      } else {
        setError(data.message || 'Failed to load task details');
        toast.error(data.message || 'Failed to load task details');
      }
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
      toast.error('Failed to load task details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (task_id && fetchedTaskIdRef.current !== task_id) {
      fetchedTaskIdRef.current = task_id;
      fetchDetails();
    }
  }, [task_id]);

  const handleRefresh = () => {
    fetchDetails();
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <DetailSkeleton />
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error || !task) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-slate-400">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{error || 'Task not found'}</p>
        <button
          onClick={() => navigate('/tasks')}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-md transition-colors"
        >
          <ArrowLeft size={15} />
          Back to Tasks
        </button>
      </div>
    );
  }

  const { firm, service, charges, dates, billing, staffs, status, billing_status, is_recurring, status_log = [] } = task;

  return (
    <div className="mx-auto space-y-2">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative mb-2 md:mb-4 rounded-md border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-4 shadow-sm shadow-slate-200/40 dark:shadow-none backdrop-blur"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pr-24 sm:pr-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">Task Details</p>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight truncate">
                {service?.name || 'Task'}
              </h1>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-mono truncate">{task?.task_id}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="absolute top-[10px] right-[10px] flex items-center gap-2">
          {/* Status Log button */}
          <button
            onClick={() => setShowStatusLog(true)}
            className="flex items-center gap-1.5 px-3 h-8 rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all shadow-sm"
            title="Status Log"
          >
            <History size={15} />
            {status_log.length > 0 && (
              <span className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold leading-none">
                {status_log.length}
              </span>
            )}
            <span className="hidden sm:inline">Status Log</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 h-8 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
            title="Refresh"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </motion.div>

      {/* ── Status strip ── */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Task Status</span>
          <StatusBadge status={status} />
        </div>
        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Billing</span>
          <StatusBadge status={billing_status} />
        </div>
        {is_recurring && (
          <>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide border border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-900/30 dark:text-violet-400">
              <Clock size={11} /> Recurring
            </span>
          </>
        )}
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left col — 2 wide */}
        <div className="lg:col-span-2 space-y-5">

          {/* Firm */}
          <Section title="Firm Information" icon={Building2} accent="indigo">
            <InfoRow label="Firm Name" value={firm?.firm_name} icon={Building2} />
            <InfoRow label="Firm Type" value={firmTypeLabel(firm?.firm_type)} icon={Tag} />
            <InfoRow label="PAN" value={firm?.tax?.pan_no} icon={FileText} />
            <InfoRow label="GST No" value={firm?.tax?.gst_no} icon={FileText} />
            <InfoRow label="TAN No" value={firm?.tax?.tan_no} icon={FileText} />
            <InfoRow label="CIN No" value={firm?.tax?.cin_no} icon={FileText} />
            <InfoRow
              label="Address"
              icon={Building2}
              value={[
                firm?.address?.address_line_1,
                firm?.address?.address_line_2,
                firm?.address?.city,
                firm?.address?.district,
                firm?.address?.state,
                firm?.address?.pincode,
              ].filter(Boolean).join(', ') || '—'}
            />
          </Section>

          {/* Service */}
          <Section title="Service Details" icon={Wrench} accent="amber">
            <InfoRow label="Service Name" value={service?.name} icon={Wrench} />
            <InfoRow label="SAC Code" value={service?.sac_code} icon={Tag} />
            <InfoRow label="Type" value={service?.type} icon={Tag} />
            <InfoRow label="Remark" value={service?.remark} icon={FileText} />
          </Section>

          {/* Dates */}
          <Section title="Timeline" icon={CalendarDays} accent="emerald">
            <InfoRow label="Due Date" value={formatDate(dates?.due_date)} icon={CalendarDays} />
            <InfoRow label="Target Date" value={formatDateTime(dates?.target_date)} icon={Clock} />
            <InfoRow label="Created On" value={formatDateTime(dates?.create_date)} icon={Clock} />
            <InfoRow label="Completed On" value={formatDateTime(dates?.complete_date)} icon={BadgeCheck} />
            <InfoRow label="Cancelled On" value={formatDateTime(dates?.cancelled_date)} icon={AlertCircle} />
          </Section>

        </div>

        {/* Right col */}
        <div className="space-y-5">

          {/* Charges */}
          <Section title="Charges" icon={IndianRupee} accent="amber">
            <div className="py-4 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Fees</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-0.5">
                  <IndianRupee size={12} />{charges?.fees ?? '—'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Tax ({charges?.tax_rate ?? 0}%)</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-0.5">
                  <IndianRupee size={12} />{charges?.tax_value ?? '—'}
                </span>
              </div>
              <div className="h-px bg-slate-200 dark:bg-slate-700" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Total</span>
                <span className="text-lg font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                  <IndianRupee size={15} />{charges?.total ?? '—'}
                </span>
              </div>
            </div>
          </Section>

          {/* Billing */}
          <Section title="Invoice" icon={Receipt} accent="slate">
            <InfoRow label="Invoice ID" value={billing?.invoice_id} icon={Receipt} />
            <InfoRow label="Invoice No" value={billing?.invoice_no} icon={FileText} />
          </Section>

          {/* Assigned Staff */}
          <Section title="Assigned Staff" icon={Users} accent="slate">
            {staffs && staffs.length > 0 ? (
              <div className="py-2 space-y-2">
                {staffs.map((staff, i) => (
                  <div key={i} className="flex items-center gap-2 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">
                      {(staff.name || 'S')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{staff.name || staff.username || 'Staff'}</p>
                      {staff.role && <p className="text-xs text-slate-400">{staff.role}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 flex flex-col items-center gap-2 text-slate-400 dark:text-slate-600">
                <Users size={24} className="opacity-40" />
                <p className="text-xs font-medium">No staff assigned</p>
              </div>
            )}
          </Section>

        </div>
      </div>

      {/* ── Status Log Modal ── */}
      <StatusLogModal
        isOpen={showStatusLog}
        onClose={() => setShowStatusLog(false)}
        logs={status_log}
      />
    </div>
  );
}
