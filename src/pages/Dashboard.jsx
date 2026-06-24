import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Scale, ArrowDownLeft, ListChecks, Building2,
  RefreshCw, Receipt, Layers, CheckSquare, BarChart2, User,
  CheckCircle2, XCircle, Zap, ShieldCheck, ExternalLink,
} from 'lucide-react';
import { formatAmount } from '../utils/helpers';
import { apiCall } from '../utils/apiCall';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

// ── animation helpers ─────────────────────────────────────────────────────────
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const cardItem = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32 } },
};

// ── Financial Card (top row) ──────────────────────────────────────────────────
function FinanceCard({ label, value, icon: Icon, iconBg, iconColor, valueColor, loading, currency = 'INR' }) {
  return (
    <motion.div
      variants={cardItem}
      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 flex items-center justify-between"
    >
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-405 dark:text-gray-500">
          {label}
        </p>
        {loading ? (
          <div className="mt-2 h-9 w-28 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
        ) : (
          <p className={`text-3xl font-extrabold mt-1.5 tabular-nums tracking-tight ${valueColor}`}>
            {formatAmount(value, currency)}
          </p>
        )}
      </div>
      <div className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center shrink-0`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
    </motion.div>
  );
}

// ── Progress Bar ──────────────────────────────────────────────────────────────
function ProgressBar({ label, value, total, color, loading }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{label}</span>
        <span className="text-sm font-bold text-gray-800 dark:text-gray-200 tabular-nums">
          {loading ? '—' : `${value} / ${total}`}
        </span>
      </div>
      <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        {!loading && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className={`h-full rounded-full ${color}`}
          />
        )}
        {loading && <div className="h-full w-1/2 animate-pulse bg-gray-200 dark:bg-gray-600 rounded-full" />}
      </div>
    </div>
  );
}

// ── Quick Link Card ───────────────────────────────────────────────────────────
function QuickLinkCard({ label, description, icon: Icon, iconBg, iconColor, onClick }) {
  return (
    <motion.button
      variants={cardItem}
      type="button"
      onClick={onClick}
      className="w-full text-left bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex items-center gap-4 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800/60 hover:-translate-y-0.5 transition-all duration-200 group"
    >
      <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-gray-800 dark:text-gray-100 leading-tight">{label}</p>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate font-normal">{description}</p>
        )}
      </div>
    </motion.button>
  );
}

// ── Dashboard Skeleton ────────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex justify-between">
        <div className="h-6 w-44 bg-gray-200 dark:bg-gray-700 rounded-md" />
        <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
        <div className="lg:col-span-5 h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
      </div>
      <div className="h-5 w-36 bg-gray-200 dark:bg-gray-700 rounded-md" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-18 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
const Dashboard = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ── Fetch dashboard data ─────────────────────────────────────────────────
  const fetchDashboard = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    else setIsLoading(true);

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
      toast.error(err.message || 'Failed to load dashboard statistics');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch on mount and when user changes
  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard, userData?.id]);

  // ── Derived values ────────────────────────────────────────────────────────
  const balance = stats?.balance?.balance ?? 0;
  const debit = stats?.balance?.debit ?? 0;
  const credit = stats?.balance?.credit ?? 0;

  const tasks = stats?.tasks ?? {};
  const firms = stats?.firms ?? {};

  const totalTasks = tasks.total ?? 0;
  const inProcess = tasks.in_process ?? 0;
  const pendingClient = tasks.pending_from_client ?? 0;
  const pendingDept = tasks.pending_from_department ?? 0;
  const completedTasks = tasks.complete ?? 0;
  const cancelledTasks = tasks.cancel ?? 0;

  const totalFirms = firms.total ?? 0;
  const activeFirms = firms.active ?? 0;
  const inactiveFirms = firms.inactive ?? 0;
  const efficiency = totalFirms > 0 ? Math.round((activeFirms / totalFirms) * 100) : 0;

  // Combined loading state for all data-dependent UI elements
  const cardsLoading = isLoading || isRefreshing;

  // ── Quick links config ────────────────────────────────────────────────────
  const quickLinks = [
    { label: 'Transaction Ledger', description: 'Sales, payments & journals', path: '/ledger', icon: Receipt, iconBg: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600 dark:text-blue-400', },
    { label: 'Firms & Orgs', description: 'Manage partner firms', path: '/firms', icon: Building2, iconBg: 'bg-violet-100 dark:bg-violet-900/30', iconColor: 'text-violet-600 dark:text-violet-400', },
    { label: 'All Tasks', description: 'Track assignments', path: '/tasks', icon: CheckSquare, iconBg: 'bg-indigo-100 dark:bg-indigo-900/30', iconColor: 'text-indigo-600 dark:text-indigo-400', },
    { label: 'Services', description: 'Browse service catalog', path: '/services', icon: Layers, iconBg: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-600 dark:text-emerald-400', },
    { label: 'My Profile', description: 'Account & preferences', path: '/profile', icon: User, iconBg: 'bg-amber-100 dark:bg-amber-900/30', iconColor: 'text-amber-600 dark:text-amber-400', },
    { label: 'Updates', description: 'Analytics & insights', path: '/updates', icon: BarChart2, iconBg: 'bg-teal-100 dark:bg-teal-900/30', iconColor: 'text-teal-600 dark:text-teal-400', }
  ];

  const taskStatusList = [
    { label: 'Completed', value: completedTasks, color: 'bg-emerald-500', textColor: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'In Process', value: inProcess, color: 'bg-blue-500', textColor: 'text-blue-600 dark:text-blue-400' },
    { label: 'Pending from Department', value: pendingDept, color: 'bg-violet-500', textColor: 'text-violet-600 dark:text-violet-400' },
    { label: 'Pending from Client', value: pendingClient, color: 'bg-amber-500', textColor: 'text-amber-600 dark:text-amber-400' },
    { label: 'Cancelled', value: cancelledTasks, color: 'bg-rose-500', textColor: 'text-rose-600 dark:text-rose-400' }
  ];

  const activeStats = taskStatusList.filter(item => item.value > 0);
  const zeroStats = taskStatusList.filter(item => item.value === 0);

  // ── Render ────────────────────────────────────────────────────────────────
  if (isLoading && !stats) {
    return <div className="min-h-screen"><DashboardSkeleton /></div>;
  }

  return (
    <div className="min-h-screen space-y-6">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            Welcome back{userData?.name ? `, ${userData.name.split(' ')[0]}` : ''}!
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Here's what's happening with your account today.
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchDashboard(true)}
          disabled={isLoading || isRefreshing}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </motion.div>

      {/* ── Financial Standings ── */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <FinanceCard
          label="Net Balance"
          value={balance}
          icon={Scale}
          iconBg="bg-blue-50 dark:bg-blue-900/30"
          iconColor="text-blue-500 dark:text-blue-400"
          valueColor="text-gray-900 dark:text-white"
          loading={cardsLoading}
        />
        <FinanceCard
          label="Total Debit"
          value={debit}
          icon={ExternalLink}
          iconBg="bg-rose-50 dark:bg-rose-900/30"
          iconColor="text-rose-500 dark:text-rose-400"
          valueColor="text-rose-600 dark:text-rose-400"
          loading={cardsLoading}
        />
        <FinanceCard
          label="Total Credit"
          value={credit}
          icon={ArrowDownLeft}
          iconBg="bg-emerald-50 dark:bg-emerald-900/30"
          iconColor="text-emerald-500 dark:text-emerald-400"
          valueColor="text-emerald-600 dark:text-emerald-400"
          loading={cardsLoading}
        />
      </motion.div>

      {/* ── Tasks Metric + Firms Directory ───────────────────────────────── */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-12 gap-4"
      >
        {/* ── Tasks Metric Card ── */}
        <motion.div
          variants={cardItem}
          className="lg:col-span-7 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="flex items-center gap-2 text-base font-bold text-gray-800 dark:text-gray-100">
              <ListChecks className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
              Tasks Metric
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 px-3 py-1 rounded-lg">
                Total: {cardsLoading ? '—' : totalTasks}
              </span>
              <button
                type="button"
                onClick={() => navigate('/tasks')}
                className="flex items-center gap-1 text-xs font-semibold text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline transition-colors"
              >
                View All
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>

          {activeStats.length > 0 && (
            <div className="space-y-4 mb-5">
              {activeStats.map((item) => (
                <ProgressBar
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  total={totalTasks}
                  color={item.color}
                  loading={cardsLoading}
                />
              ))}
            </div>
          )}

          {zeroStats.length > 0 && (
            <div className={`grid gap-2 pt-4 border-t border-gray-100 dark:border-gray-700 ${zeroStats.length === 5 ? 'grid-cols-2 sm:grid-cols-5' :
              zeroStats.length === 4 ? 'grid-cols-2 sm:grid-cols-4' :
                zeroStats.length === 3 ? 'grid-cols-3' :
                  zeroStats.length === 2 ? 'grid-cols-2' :
                    'grid-cols-1'
              }`}>
              {zeroStats.map(({ label, value, textColor }) => (
                <div key={label} className="text-center py-2 bg-gray-50 dark:bg-gray-700/40 rounded-xl">
                  {cardsLoading
                    ? <div className="h-5 w-6 animate-pulse bg-gray-200 dark:bg-gray-600 rounded mx-auto mb-1" />
                    : <p className={`text-lg font-extrabold tabular-nums ${textColor}`}>{value}</p>
                  }
                  <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-0.5">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* ── Firms Directory Card ── */}
        <motion.div
          variants={cardItem}
          onClick={() => navigate('/firms')}
          className="lg:col-span-5 cursor-pointer bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 flex flex-col hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800/50 transition-all duration-200 group"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="flex items-center gap-2 text-base font-bold text-gray-800 dark:text-gray-100">
              <Building2 className="w-5 h-5 text-violet-500 dark:text-violet-400" />
              Firms Directory
            </h2>
            <span className="text-xs font-bold bg-violet-50 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300 px-3 py-1 rounded-lg">
              Total: {cardsLoading ? '—' : totalFirms}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 flex-1">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/40 rounded-xl flex flex-col items-center justify-center p-4 gap-1.5">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 dark:text-emerald-400 mb-1" />
              {cardsLoading
                ? <div className="h-8 w-10 animate-pulse bg-gray-200 dark:bg-gray-700 rounded" />
                : <p className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-300 tabular-nums">{activeFirms}</p>
              }
              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                Active Firms
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center p-4 gap-1.5">
              <XCircle className="w-6 h-6 text-gray-400 dark:text-gray-500 mb-1" />
              {cardsLoading
                ? <div className="h-8 w-10 animate-pulse bg-gray-200 dark:bg-gray-700 rounded" />
                : <p className="text-3xl font-extrabold text-gray-500 dark:text-gray-400 tabular-nums">{inactiveFirms}</p>
              }
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                Inactive Firms
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {totalFirms > 0
                ? `${efficiency}% Operational Efficiency`
                : 'No firms recorded yet'}
            </p>
            {efficiency === 100 && totalFirms > 0 && (
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* ── Quick Actions ────────────────────────────────────────────────── */}
      <div>
        <motion.h2
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-200 mb-3"
        >
          <Zap className="w-4 h-4 text-amber-400" fill="currentColor" />
          Quick Actions
        </motion.h2>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          {quickLinks.map(({ label, description, path, icon, iconBg, iconColor }) => (
            <QuickLinkCard
              key={path}
              label={label}
              description={description}
              icon={icon}
              iconBg={iconBg}
              iconColor={iconColor}
              onClick={() => navigate(path)}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;