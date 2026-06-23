import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckSquare, ArrowLeft, Building2, Wrench, IndianRupee,
  CalendarDays, Clock, Upload, Users, Receipt,
  BadgeCheck, AlertCircle, Loader2, FileText, Tag
} from 'lucide-react';
import { apiCall } from '../utils/apiCall';
import toast from 'react-hot-toast';

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

// ── main component ─────────────────────────────────────────────────────────────

export default function TaskDetails() {
  const { task_id } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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

    if (task_id) fetchDetails();
  }, [task_id]);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <p className="text-sm font-medium">Loading task details…</p>
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

  const { firm, service, charges, dates, billing, staffs, status, billing_status, is_recurring } = task;

  return (
    <div className="mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">Task Details</p>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
              {service?.name || 'Task'}
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-mono">{task.task_id}</p>
          </div>
        </div>
      </div>

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
    </div>
  );
}
