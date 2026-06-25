import React, { useState, useEffect, useRef } from 'react';
import { DetailSkeleton } from '../components/SkeletonComponent';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Building2, Wrench, IndianRupee,
  CalendarDays, Clock, FileText, Tag, MapPin, Map,
  User, CheckCircle, XCircle, AlertCircle, Loader2, RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { apiCall } from '../utils/apiCall';
import toast from 'react-hot-toast';

// ── helpers ────────────────────────────────────────────────────────────────────

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
  if (status === true) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide border text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-900/30 dark:border-emerald-800">
        <CheckCircle size={12} className="mr-1" /> Active
      </span>
    );
  }
  if (status === false) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide border text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-900/30 dark:border-rose-800">
        <XCircle size={12} className="mr-1" /> Inactive
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide border text-slate-700 bg-slate-100 border-slate-200 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700">
      Unknown
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

const Section = ({ title, icon: Icon, accent = 'indigo', children }) => {
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

export default function FirmDetails() {
  const { firm_id } = useParams();
  const navigate = useNavigate();

  const [firm, setFirm] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchedFirmIdRef = useRef(null);

  const fetchDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiCall(`/firm/details/${firm_id}`, 'GET');
      const data = await response.json();
      if (response.ok && data.success !== false) {
        setFirm(data.data);
      } else {
        setError(data.message || 'Failed to load firm details');
        toast.error(data.message || 'Failed to load firm details');
      }
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
      toast.error('Failed to load firm details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (firm_id && fetchedFirmIdRef.current !== firm_id) {
      fetchedFirmIdRef.current = firm_id;
      fetchDetails();
    }
  }, [firm_id]);

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
  if (error || !firm) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-slate-400">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{error || 'Firm not found'}</p>
        <button
          onClick={() => navigate('/firms')}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors"
        >
          <ArrowLeft size={15} />
          Back to Firms
        </button>
      </div>
    );
  }

  const { tax, address, audit } = firm;

  return (
    <div className="mx-auto space-y-2">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative mb-2 md:mb-4 rounded-md border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-4 shadow-sm shadow-slate-200/40 dark:shadow-none backdrop-blur"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pr-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Firm Details</p>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                {firm?.firm_name || 'Firm'}
              </h1>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-mono">{firm?.firm_id}</p>
            </div>
          </div>
        </div>

        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          className="absolute top-[10px] right-[10px] flex items-center justify-center h-[34px] gap-2 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
          title="Refresh"
        >
          <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </motion.div>

      {/* ── Status strip ── */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</span>
          <StatusBadge status={firm.status} />
        </div>
        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide border text-indigo-700 bg-indigo-50 border-indigo-200 dark:text-indigo-400 dark:bg-indigo-900/30 dark:border-indigo-800">
            {firmTypeLabel(firm.firm_type)}
          </span>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left col — 2 wide */}
        <div className="lg:col-span-2 space-y-5">

          {/* Core Info */}
          <Section title="General Information" icon={Building2} accent="indigo">
            <InfoRow label="Firm Name" value={firm?.firm_name} icon={Building2} />
            <InfoRow label="Username" value={firm?.username} icon={User} />
            <InfoRow label="Remark" value={firm?.remark} icon={FileText} />
          </Section>

          {/* Tax Information */}
          <Section title="Tax & Registration" icon={FileText} accent="amber">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <InfoRow label="PAN Number" value={tax?.pan_no} icon={Tag} />
              <InfoRow label="GST Number" value={tax?.gst_no} icon={Tag} />
              <InfoRow label="TAN Number" value={tax?.tan_no} icon={Tag} />
              <InfoRow label="VAT Number" value={tax?.vat_no} icon={Tag} />
              <InfoRow label="CIN Number" value={tax?.cin_no} icon={Tag} />
              <InfoRow label="File Number" value={tax?.file_no} icon={Tag} />
            </div>
          </Section>

        </div>

        {/* Right col */}
        <div className="space-y-5">

          {/* Address */}
          <Section title="Address Details" icon={MapPin} accent="emerald">
            <InfoRow label="Address Line 1" value={address?.address_line_1} icon={MapPin} />
            <InfoRow label="Address Line 2" value={address?.address_line_2} icon={MapPin} />
            <InfoRow label="City" value={address?.city} icon={Map} />
            <InfoRow label="District" value={address?.district} icon={Map} />
            <InfoRow label="State" value={address?.state} icon={Map} />
            <InfoRow label="Pincode" value={address?.pincode} icon={Map} />
            <InfoRow label="Country" value={address?.country} icon={Map} />
          </Section>

          {/* Audit */}
          <Section title="Audit Details" icon={Clock} accent="slate">
            {audit?.create_by && (
              <InfoRow
                label="Created By"
                value={`${audit.create_by.name || ''} (${audit.create_by.mobile || ''})`}
                icon={User}
              />
            )}
            <InfoRow label="Created On" value={formatDateTime(audit?.create_date)} icon={Clock} />

            {audit?.modify_by && (
              <InfoRow
                label="Last Modified By"
                value={`${audit.modify_by.name || ''} (${audit.modify_by.mobile || ''})`}
                icon={User}
              />
            )}
            <InfoRow label="Last Modified On" value={formatDateTime(audit?.modify_date)} icon={Clock} />
          </Section>

        </div>
      </div>
    </div>
  );
}
