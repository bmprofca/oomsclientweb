import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Wallet, Activity, CheckCircle, Building2, CreditCard,
  ArrowRight, TrendingUp, TrendingDown, Clock, XCircle,
  RefreshCw, AlertCircle,
} from 'lucide-react';
import { formatAmount } from '../utils/helpers';
import { apiCall } from '../utils/apiCall';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

// ── animation helpers ────────────────────────────────────────────────────────

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } };

// ── stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, iconBg, iconColor, footer, onClick, loading }) {
  return (
    <motion.div
      variants={item}
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between gap-3 transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 hover:-translate-y-0.5' : ''}`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">{label}</p>
          {loading ? (
            <div className="mt-2 h-8 w-20 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
          ) : (
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1 tabular-nums">{value}</p>
          )}
        </div>
        <div className={`p-2.5 rounded-lg ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
      {footer && (
        <div className="flex items-center text-xs font-semibold gap-1 mt-1">
          {footer}
        </div>
      )}
    </motion.div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

const Dashboard = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [isPaying, setIsPaying] = useState(false);

  // ── fetch ──────────────────────────────────────────────────────────────────

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiCall('/report/dashboard', 'GET');
      const data = await response.json();
      if (response.ok && data.success !== false) {
        setStats(data.data);
      } else {
        toast.error(data.message || 'Failed to load dashboard');
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  // ── derived values ─────────────────────────────────────────────────────────

  const balance = stats?.balance?.balance ?? 0;
  const debit   = stats?.balance?.debit   ?? 0;
  const credit  = stats?.balance?.credit  ?? 0;

  const tasks      = stats?.tasks  ?? {};
  const firms      = stats?.firms  ?? {};

  const totalTasks     = tasks.total               ?? 0;
  const inProcess      = tasks.in_process          ?? 0;
  const pendingClient  = tasks.pending_from_client ?? 0;
  const pendingDept    = tasks.pending_from_department ?? 0;
  const completedTasks = tasks.complete            ?? 0;
  const cancelledTasks = tasks.cancel              ?? 0;

  const totalFirms    = firms.total    ?? 0;
  const activeFirms   = firms.active   ?? 0;
  const inactiveFirms = firms.inactive ?? 0;

  // ── payment handler ────────────────────────────────────────────────────────

  const handlePayNow = () => {
    if (balance <= 0) { toast.info('Your balance is already cleared!'); return; }
    setIsPaymentModalOpen(true);
  };

  const handleConfirmPayment = () => {
    setIsPaying(true);
    setTimeout(() => {
      toast.success(`Payment of ${formatAmount(balance)} successfully processed!`);
      setIsPaying(false);
      setIsPaymentModalOpen(false);
    }, 1200);
  };

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Welcome back!</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Here's what's happening today.</p>
        </div>

        <button
          type="button"
          onClick={fetchDashboard}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
        >
          <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </motion.div>

      {/* ── Balance Hero Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 dark:from-blue-700 dark:via-blue-800 dark:to-indigo-900 rounded-xl shadow-lg border border-blue-500/20 text-white p-5 sm:p-6 relative overflow-hidden"
      >
        {/* Decorative blobs */}
        <div className="absolute right-0 bottom-0 w-40 h-40 bg-white/5 rounded-full blur-2xl -mr-10 -mb-10 pointer-events-none" />
        <div className="absolute left-1/3 top-0 w-28 h-28 bg-blue-400/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Main balance */}
          <div>
            <p className="text-blue-100 text-xs font-semibold tracking-widest uppercase">Outstanding Balance</p>
            {isLoading ? (
              <div className="mt-2 h-9 w-36 animate-pulse rounded-lg bg-white/20" />
            ) : (
              <h2 className="text-3xl sm:text-4xl font-extrabold mt-1 tabular-nums tracking-tight">
                {formatAmount(balance)}
              </h2>
            )}
            <p className="mt-1 text-blue-100/70 text-xs">
              {balance > 0 ? 'Pending dues require immediate clearing' : 'All dues are successfully cleared ✓'}
            </p>
          </div>

          {/* Sub-stats: debit / credit */}
          <div className="flex gap-4 sm:gap-6">
            <div className="text-center">
              <p className="text-blue-200 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 justify-center">
                <TrendingUp size={11} /> Debit
              </p>
              {isLoading
                ? <div className="mt-1 h-5 w-20 animate-pulse rounded bg-white/20 mx-auto" />
                : <p className="text-base font-bold tabular-nums mt-0.5">{formatAmount(debit)}</p>
              }
            </div>
            <div className="w-px bg-white/20 hidden sm:block" />
            <div className="text-center">
              <p className="text-blue-200 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 justify-center">
                <TrendingDown size={11} /> Credit
              </p>
              {isLoading
                ? <div className="mt-1 h-5 w-20 animate-pulse rounded bg-white/20 mx-auto" />
                : <p className="text-base font-bold tabular-nums mt-0.5">{formatAmount(credit)}</p>
              }
            </div>
          </div>

          {/* Pay Now */}
          <button
            onClick={handlePayNow}
            disabled={balance <= 0 || isLoading}
            className={`shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold shadow-md transition-all ${
              balance > 0 && !isLoading
                ? 'bg-white text-indigo-700 hover:bg-slate-50 hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-white/20 text-white/60 cursor-not-allowed'
            }`}
          >
            {balance > 0 ? 'Pay Now' : 'Paid'}
            {balance > 0 && <ArrowRight size={15} />}
          </button>
        </div>
      </motion.div>

      {/* ── Task Stats Row ── */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6"
      >
        <StatCard
          label="Total Tasks"
          value={totalTasks}
          icon={Activity}
          iconBg="bg-slate-100 dark:bg-slate-800"
          iconColor="text-slate-600 dark:text-slate-400"
          loading={isLoading}
          onClick={() => navigate('/tasks')}
          footer={<><ArrowRight size={11} /><span className="text-slate-500 dark:text-slate-400">All Tasks</span></>}
        />
        <StatCard
          label="In Process"
          value={inProcess}
          icon={RefreshCw}
          iconBg="bg-blue-50 dark:bg-blue-950/40"
          iconColor="text-blue-600 dark:text-blue-400"
          loading={isLoading}
          onClick={() => navigate('/tasks/ongoing')}
          footer={<><ArrowRight size={11} /><span className="text-blue-600 dark:text-blue-400">View</span></>}
        />
        <StatCard
          label="Pending (Client)"
          value={pendingClient}
          icon={Clock}
          iconBg="bg-amber-50 dark:bg-amber-950/40"
          iconColor="text-amber-600 dark:text-amber-400"
          loading={isLoading}
          footer={<><AlertCircle size={11} className="text-amber-500" /><span className="text-amber-600 dark:text-amber-400">Client Side</span></>}
        />
        <StatCard
          label="Completed"
          value={completedTasks}
          icon={CheckCircle}
          iconBg="bg-emerald-50 dark:bg-emerald-950/40"
          iconColor="text-emerald-600 dark:text-emerald-400"
          loading={isLoading}
          onClick={() => navigate('/tasks/completed')}
          footer={<><ArrowRight size={11} /><span className="text-emerald-600 dark:text-emerald-400">View</span></>}
        />
        <StatCard
          label="Cancelled"
          value={cancelledTasks}
          icon={XCircle}
          iconBg="bg-rose-50 dark:bg-rose-950/40"
          iconColor="text-rose-600 dark:text-rose-400"
          loading={isLoading}
          footer={null}
        />
      </motion.div>

      {/* ── Firms + Pending Dept Row ── */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {/* Firms */}
        <motion.div
          variants={item}
          onClick={() => navigate('/firms')}
          className="cursor-pointer bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 hover:-translate-y-0.5 transition-all"
        >
          <div className="flex justify-between items-start mb-3">
            <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">Firms</p>
            <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40">
              <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-8 w-12 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700 mb-3" />
          ) : (
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-3 tabular-nums">{totalFirms}</p>
          )}
          <div className="flex gap-3 text-xs">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              {activeFirms} Active
            </span>
            <span className="flex items-center gap-1 text-gray-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 inline-block" />
              {inactiveFirms} Inactive
            </span>
          </div>
        </motion.div>

        {/* Pending from Department */}
        <motion.div
          variants={item}
          className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between"
        >
          <div className="flex justify-between items-start mb-3">
            <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">Pending (Dept)</p>
            <div className="p-2.5 rounded-lg bg-violet-50 dark:bg-violet-950/40">
              <Clock className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-8 w-12 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
          ) : (
            <p className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums">{pendingDept}</p>
          )}
          <p className="mt-2 text-xs text-violet-600 dark:text-violet-400 font-semibold">Awaiting department action</p>
        </motion.div>

        {/* Quick links / navigation placeholder */}
        <motion.div
          variants={item}
          className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-800 dark:to-gray-900 p-5 rounded-xl border border-slate-200 dark:border-gray-700 flex flex-col justify-between gap-2"
        >
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Quick Links</p>
          {[
            { label: 'View Ledger', path: '/ledger', color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Manage Firms', path: '/firms', color: 'text-indigo-600 dark:text-indigo-400' },
            { label: 'All Tasks', path: '/tasks', color: 'text-amber-600 dark:text-amber-400' },
          ].map(({ label, path, color }) => (
            <button
              key={path}
              type="button"
              onClick={() => navigate(path)}
              className={`flex items-center gap-1.5 text-xs font-semibold ${color} hover:underline text-left`}
            >
              <ArrowRight size={12} />
              {label}
            </button>
          ))}
        </motion.div>
      </motion.div>

      {/* ── Payment Confirmation Modal ── */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Complete Outstanding Payment"
        icon={CreditCard}
        confirmText={isPaying ? 'Processing…' : 'Confirm Payment'}
        onConfirm={handleConfirmPayment}
      >
        <div className="space-y-4 text-slate-700 dark:text-gray-300">
          <div className="p-4 bg-gray-50 dark:bg-gray-900/60 rounded-lg border border-gray-100 dark:border-gray-800">
            <p className="text-xs text-slate-500 dark:text-gray-400">Total Payable Amount</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{formatAmount(balance)}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Select Payment Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'upi', emoji: '⚡', label: 'UPI / Net Banking' },
                { id: 'card', emoji: '💳', label: 'Credit / Debit Card' },
              ].map(({ id, emoji, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPaymentMethod(id)}
                  className={`p-3 rounded-lg border text-sm font-semibold transition-all flex items-center gap-2 justify-center ${
                    paymentMethod === id
                      ? 'border-blue-600 bg-blue-50/50 text-blue-600 dark:border-blue-500 dark:bg-blue-950/20 dark:text-blue-400'
                      : 'border-slate-200 hover:border-slate-300 dark:border-gray-700 dark:hover:border-gray-600 text-slate-600 dark:text-gray-400'
                  }`}
                >
                  <span>{emoji}</span> {label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center">
            By clicking confirm, you consent to initiate this payment.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;