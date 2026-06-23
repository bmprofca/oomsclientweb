import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Wallet, Activity, CheckCircle, Building2, CreditCard, ArrowRight } from 'lucide-react';
import { formatAmount } from '../utils/helpers';
import { useToast } from '../contexts/ToastContext';
import Modal from '../components/common/Modal';

// ─── Dashboard-local dummy data (independent of Firms/Task pages) ────────────
// Replace these with your real dashboard API call when ready.
const DASHBOARD_FIRMS = [
  { id: 1, name: 'Alpha Corp' },
  { id: 2, name: 'Beta Ltd' },
  { id: 3, name: 'Gamma Inc' },
];

const DASHBOARD_TASKS = [
  { id: 1, title: 'GST Filing – Q1', status: 'In Progress' },
  { id: 2, title: 'ITR Preparation', status: 'In Progress' },
  { id: 3, title: 'Audit Report – FY24', status: 'Completed' },
  { id: 4, title: 'Balance Sheet Review', status: 'Completed' },
  { id: 5, title: 'TDS Return', status: 'Completed' },
];
// ─────────────────────────────────────────────────────────────────────────────

const Dashboard = () => {
  const navigate = useNavigate();
  const showToast = useToast();

  // Local state for interactive balance and payment modal
  const [balance, setBalance] = useState(24500);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [isPaying, setIsPaying] = useState(false);

  // Dynamic calculations from dashboard-local data
  const firmCount = DASHBOARD_FIRMS.length;
  const runningTaskCount = DASHBOARD_TASKS.filter(t => t.status === 'In Progress').length;
  const completedTaskCount = DASHBOARD_TASKS.filter(t => t.status === 'Completed').length;

  const handlePayNow = () => {
    if (balance <= 0) {
      showToast.info('Your balance is already paid!');
      return;
    }
    setIsPaymentModalOpen(true);
  };

  const handleConfirmPayment = () => {
    setIsPaying(true);
    setTimeout(() => {
      showToast.success(`Payment of ${formatAmount(balance)} successfully processed!`);
      setBalance(0);
      setIsPaying(false);
      setIsPaymentModalOpen(false);
    }, 1200);
  };

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="flex bg-transparent">
      {/* Main Content */}
      <div className="flex-1">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Welcome back!</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Here's what's happening today.</p>
          </div>

          {/* Reset demo balance button */}
          {balance === 0 && (
            <motion.button
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={() => setBalance(24500)}
              className="px-4 py-2 text-xs font-semibold rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
            >
              Reset Balance to ₹24,500 (Demo)
            </motion.button>
          )}
        </motion.div>

        {/* Top metrics */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {/* 1. Balance & Pay Now Card */}
          <motion.div
            variants={item}
            className="col-span-1 md:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-700 dark:to-indigo-900 p-6 rounded-md shadow-lg border border-blue-500/20 text-white flex flex-col justify-between min-h-[180px] hover:shadow-xl hover:shadow-indigo-500/10 dark:hover:shadow-none transition-all relative overflow-hidden"
          >
            <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-8 -mb-8 pointer-events-none" />
            <div className="absolute left-1/3 top-0 w-24 h-24 bg-blue-400/10 rounded-full blur-xl pointer-events-none" />

            <div className="flex justify-between items-start">
              <div>
                <p className="text-blue-100 text-xs font-semibold tracking-wider uppercase">Account Balance</p>
                <h3 className="text-3xl font-extrabold mt-1 tracking-tight">{formatAmount(balance)}</h3>
              </div>
              <div className="p-3 bg-white/10 rounded-md backdrop-blur-md">
                <Wallet className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3 items-center justify-between">
              <span className="text-xs text-blue-100">
                {balance > 0 ? 'Pending dues requires immediate clearing' : 'All dues are successfully cleared'}
              </span>
              <button
                onClick={handlePayNow}
                disabled={balance <= 0}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-bold shadow-md transition-all ${balance > 0
                  ? 'bg-white text-indigo-700 hover:bg-slate-50 hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-white/20 text-white/60 cursor-not-allowed'
                  }`}
              >
                <span>{balance > 0 ? 'Pay Now' : 'Paid'}</span>
                {balance > 0 && <ArrowRight size={16} />}
              </button>
            </div>
          </motion.div>

          {/* 2. Registered Firms Card */}
          <motion.div
            variants={item}
            onClick={() => navigate('/firms')}
            className="cursor-pointer bg-white dark:bg-gray-800 p-6 rounded-md shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 transition-all flex flex-col justify-between"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-wider">Registered Firms</h3>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{firmCount}</p>
              </div>
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-md text-indigo-600 dark:text-indigo-400">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-indigo-600 dark:text-indigo-400 font-semibold gap-1">
              <span>View Firms</span>
              <ArrowRight size={12} />
            </div>
          </motion.div>

          {/* 3. Running Tasks Card */}
          <motion.div
            variants={item}
            onClick={() => navigate('/tasks/ongoing')}
            className="cursor-pointer bg-white dark:bg-gray-800 p-6 rounded-md shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 transition-all flex flex-col justify-between"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-wider">Running Tasks</h3>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{runningTaskCount}</p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-md text-amber-600 dark:text-amber-400">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-amber-600 dark:text-amber-400 font-semibold gap-1">
              <span>Track Running tasks</span>
              <ArrowRight size={12} />
            </div>
          </motion.div>
        </motion.div>

        {/* Secondary metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* 4. Completed Tasks Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => navigate('/tasks/completed')}
            className="cursor-pointer bg-white dark:bg-gray-800 p-6 rounded-md shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 transition-all flex flex-col justify-between"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-wider">Completed Tasks</h3>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{completedTaskCount}</p>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-md text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-semibold gap-1">
              <span>View Completed task</span>
              <ArrowRight size={12} />
            </div>
          </motion.div>

          {/* Activity placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-md shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col justify-center min-h-[140px]"
          >
            <div className="text-center text-gray-400 dark:text-gray-500 py-4">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">Metrics are connected and loaded from live local configurations.</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Payment Confirmation Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Complete Outstanding Payment"
        icon={CreditCard}
        confirmText={isPaying ? 'Processing...' : 'Confirm Payment'}
        onConfirm={handleConfirmPayment}
      >
        <div className="space-y-4 text-slate-700 dark:text-gray-300">
          <div className="p-4 bg-gray-50 dark:bg-gray-900/60 rounded-md border border-gray-100 dark:border-gray-800">
            <p className="text-xs text-slate-500 dark:text-gray-400">Total Payable Amount</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {formatAmount(balance)}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Select Payment Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`p-3 rounded-md border text-sm font-semibold transition-all flex items-center gap-2 justify-center ${paymentMethod === 'upi'
                  ? 'border-blue-600 bg-blue-50/50 text-blue-600 dark:border-blue-500 dark:bg-blue-950/20 dark:text-blue-400'
                  : 'border-slate-200 hover:border-slate-300 dark:border-gray-700 dark:hover:border-gray-600 text-slate-600 dark:text-gray-400'
                  }`}
              >
                <span>⚡</span> UPI / Net Banking
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-3 rounded-md border text-sm font-semibold transition-all flex items-center gap-2 justify-center ${paymentMethod === 'card'
                  ? 'border-blue-600 bg-blue-50/50 text-blue-600 dark:border-blue-500 dark:bg-blue-950/20 dark:text-blue-400'
                  : 'border-slate-200 hover:border-slate-300 dark:border-gray-700 dark:hover:border-gray-600 text-slate-600 dark:text-gray-400'
                  }`}
              >
                <span>💳</span> Credit / Debit Card
              </button>
            </div>
          </div>

          <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center mt-2">
            By clicking confirm, you consent to simulate this payment using local dummy values.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;