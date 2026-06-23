import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Layers, IndianRupee, Clock, Edit, FileText, Tag,
  AlertCircle, Loader2, Wrench, Globe, CalendarDays, CheckCircle, XCircle
} from 'lucide-react';
import { apiCall } from '../utils/apiCall';
import toast from 'react-hot-toast';

// ── helpers ────────────────────────────────────────────────────────────────────

const formatType = (typeStr) => {
  if (!typeStr) return '—';
  return typeStr.charAt(0).toUpperCase() + typeStr.slice(1);
};

const BooleanBadge = ({ value, label }) => {
  if (value) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide border text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-900/30 dark:border-emerald-800">
        <CheckCircle size={12} className="mr-1" /> Yes
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide border text-slate-700 bg-slate-50 border-slate-200 dark:text-slate-400 dark:bg-slate-900/30 dark:border-slate-800">
      <XCircle size={12} className="mr-1" /> No
    </span>
  );
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
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      <div className={`flex items-center gap-2 px-5 py-3.5 border-b-2 ${accents[accent]} border-opacity-60 bg-slate-50/60 dark:bg-slate-800/40`}>
        {Icon && <Icon size={15} className={accents[accent].split(' ')[1]} />}
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 tracking-tight">{title}</h3>
      </div>
      <div className="px-5 py-1">{children}</div>
    </div>
  );
};

// ── main component ─────────────────────────────────────────────────────────────

export default function ServiceDetails() {
  const { service_id } = useParams();
  const navigate = useNavigate();

  const [serviceDetails, setServiceDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const abortControllerRef = useRef(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);
      try {
        const response = await apiCall(`/service/details/${service_id}`, 'GET', null, { signal: abortControllerRef.current.signal });
        const data = await response.json();
        if (response.ok && data.success !== false) {
          setServiceDetails(data.data);
        } else {
          setError(data.message || 'Failed to load service details');
          toast.error(data.message || 'Failed to load service details');
        }
        setIsLoading(false);
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error(err);
        setError('Something went wrong. Please try again.');
        toast.error('Failed to load service details');
        setIsLoading(false);
      }
    };

    if (service_id) fetchDetails();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [service_id]);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm font-medium">Loading service details…</p>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error || !serviceDetails) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-slate-400">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{error || 'Service not found'}</p>
        <button
          onClick={() => navigate('/services')}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <ArrowLeft size={15} />
          Back to Services
        </button>
      </div>
    );
  }

  const { service, branch, charges } = serviceDetails;

  return (
    <div className="mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">Service Details</p>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
              {serviceDetails?.name || 'Service'}
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-mono">{serviceDetails.service_id}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => console.log('Edit service', service_id)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-blue-600/20"
          >
            <Edit size={14} />
            Edit Service
          </button>
        </div>
      </div>

      {/* ── Status strip ── */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</span>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide border ${serviceDetails.type === 'compliance' ? 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-900/30 dark:border-amber-800' : 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-900/30 dark:border-emerald-800'}`}>
            {formatType(serviceDetails.type)}
          </span>
        </div>
        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Frequency</span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide border text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/30 dark:border-blue-800">
            <Clock size={11} className="mr-1" /> {formatType(serviceDetails.frequency)}
          </span>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left col — 2 wide */}
        <div className="lg:col-span-2 space-y-5">

          {/* General */}
          <Section title="General Settings" icon={Layers} accent="blue">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <InfoRow label="Service Name" value={serviceDetails?.name} icon={Layers} />
              <InfoRow label="SAC Code" value={serviceDetails?.sac_code} icon={Tag} />
              <InfoRow label="Compliance" badge={<BooleanBadge value={serviceDetails?.compliance} />} icon={FileText} />
              <InfoRow label="Global" badge={<BooleanBadge value={serviceDetails?.global} />} icon={Globe} />
            </div>
          </Section>

          {/* Properties */}
          <Section title="Service Properties" icon={Wrench} accent="slate">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
               <InfoRow label="Default Amount" value={service?.default_amount} icon={IndianRupee} />
               <InfoRow label="Required Fields" value={service?.required_fields} icon={FileText} />
               <InfoRow label="Service Remark" value={service?.remark} icon={FileText} />
               <InfoRow label="Branch Remark" value={branch?.remark} icon={FileText} />
             </div>
          </Section>

          {/* Due Days (Only if relevant) */}
          <Section title="Filing / Due Days" icon={CalendarDays} accent="emerald">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <InfoRow label="Monthly Due Day" value={service?.due_day} icon={CalendarDays} />
              <InfoRow label="Q1 Due Day" value={service?.q1_due_day} icon={CalendarDays} />
              <InfoRow label="Q2 Due Day" value={service?.q2_due_day} icon={CalendarDays} />
              <InfoRow label="Q3 Due Day" value={service?.q3_due_day} icon={CalendarDays} />
              <InfoRow label="Q4 Due Day" value={service?.q4_due_day} icon={CalendarDays} />
              <InfoRow label="H1 Due Day" value={service?.h1_due_day} icon={CalendarDays} />
              <InfoRow label="H2 Due Day" value={service?.h2_due_day} icon={CalendarDays} />
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
                <span className="text-slate-500 dark:text-slate-400 font-medium">GST ({charges?.gst_rate ?? 0}%)</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-0.5">
                  <IndianRupee size={12} />{charges?.gst_value ?? '—'}
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

        </div>
      </div>
    </div>
  );
}
