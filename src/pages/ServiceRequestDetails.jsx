import React, { useState, useEffect, useRef } from 'react';
import { DetailSkeleton } from '../components/SkeletonComponent';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Layers, IndianRupee, FileText, Tag,
  AlertCircle, Building2, CheckCircle, XCircle, RefreshCw, Activity, ClipboardList
} from 'lucide-react';
import { motion } from 'framer-motion';
import { apiCall } from '../utils/apiCall';
import toast from 'react-hot-toast';

// ── helpers ────────────────────────────────────────────────────────────────────

const formatType = (typeStr) => {
  if (!typeStr) return '—';
  return typeStr.charAt(0).toUpperCase() + typeStr.slice(1);
};

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800';
    case 'approved': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800';
    case 'rejected': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800';
    case 'completed': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800';
    default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
  }
};

const InfoRow = ({ label, value, icon: Icon, badge }) => (
  <div className="flex items-start gap-3 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
    {Icon && (
      <div className="mt-0.5 shrink-0 p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
        <Icon size={13} />
      </div>
    )}
    <div className="flex-1 min-w-0 flex justify-between items-center">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</p>
        {badge ? (
          <div className="mt-1.5">{badge}</div>
        ) : (
          <p className="mt-0.5 text-sm font-medium text-slate-800 dark:text-slate-200 break-words">{value ?? '—'}</p>
        )}
      </div>
    </div>
  </div>
);

const Section = ({ title, icon: Icon, accent = 'blue', children }) => {
  const accents = {
    amber: 'border-amber-400 text-amber-600 dark:text-amber-400',
    blue: 'border-blue-400 text-blue-600 dark:text-blue-400',
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

export default function ServiceRequestDetails() {
  const { request_id } = useParams();
  const navigate = useNavigate();

  const [requestDetails, setRequestDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const abortControllerRef = useRef(null);
  const fetchedRequestIdRef = useRef(null);

  const fetchDetails = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);
    try {
      const response = await apiCall(`/service/service-request/details/${request_id}`, 'GET', null, { signal: abortControllerRef.current.signal });
      const data = await response.json();
      if (response.ok && data.success !== false) {
        setRequestDetails(data.data);
      } else {
        setError(data.message || 'Failed to load request details');
        toast.error(data.message || 'Failed to load request details');
      }
      setIsLoading(false);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error(err);
      setError('Something went wrong. Please try again.');
      toast.error('Failed to load request details');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (request_id && fetchedRequestIdRef.current !== request_id) {
      fetchedRequestIdRef.current = request_id;
      fetchDetails();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [request_id]);

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
  if (error || !requestDetails) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-slate-400">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{error || 'Service request not found'}</p>
        <button
          onClick={() => navigate('/service-requests')}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
        >
          <ArrowLeft size={15} />
          Back to Service Requests
        </button>
      </div>
    );
  }

  const { service, firm, charges, status, client_remark, office_remark, task_id, create_date } = requestDetails;

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
              <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">Service Request</p>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                {service?.name || 'Service Request'}
              </h1>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-mono">{requestDetails?.request_id}</p>
            </div>
          </div>
        </div>

        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          className="absolute top-[10px] right-[10px] flex items-center gap-2 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
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
          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide border ${getStatusColor(status)}`}>
            {formatType(status)}
          </span>
        </div>
        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</span>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {create_date ? create_date.split(' ')[0] : '—'}
          </span>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left col — 2 wide */}
        <div className="lg:col-span-2 space-y-5">

          {/* General */}
          <Section title="General Details" icon={Activity} accent="blue">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <InfoRow label="Firm Name" value={firm?.firm_name} icon={Building2} />
              <InfoRow label="Firm Type" value={formatType(firm?.firm_type)} icon={Building2} />
              <InfoRow label="Service Name" value={service?.name} icon={Layers} />
              <InfoRow label="SAC Code" value={service?.sac_code} icon={Tag} />
              <InfoRow label="Service Type" value={formatType(service?.type)} icon={Tag} />
              <InfoRow label="Task ID" value={task_id || 'Not Assigned'} icon={ClipboardList} />
            </div>
          </Section>

          {/* Remarks */}
          <Section title="Remarks" icon={FileText} accent="slate">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <InfoRow label="Client Remark" value={client_remark} icon={FileText} />
              <InfoRow label="Office Remark" value={office_remark} icon={FileText} />
            </div>
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
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Total Amount</span>
                <span className="text-lg font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                  <IndianRupee size={15} />{charges?.amount ?? '—'}
                </span>
              </div>
            </div>
          </Section>

        </div>
      </div>
    </div>
  );
}
