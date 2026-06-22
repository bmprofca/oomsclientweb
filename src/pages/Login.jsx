import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Fingerprint, Lock, ArrowRight, Loader2, KeyRound } from 'lucide-react';

const Login = () => {
  const [step, setStep] = useState(1); // 1: PAN, 2: OTP
  const [panNumber, setPanNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { sendOtp, login } = useAuth();
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    
    // Basic PAN validation (10 alphanumeric characters)
    const panRegex = /^[A-Z0-9]{10}$/i;
    if (!panRegex.test(panNumber)) {
      setError('Please enter a valid 10-character PAN number.');
      return;
    }

    setIsSubmitting(true);
    try {
      await sendOtp({ panNumber: panNumber.toUpperCase() });
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    
    if (otp.length < 4) {
      setError('Please enter a valid OTP.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ panNumber: panNumber.toUpperCase(), otp });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute -bottom-[30%] -right-[10%] w-[70%] h-[70%] rounded-full bg-pink-600/10 blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 relative z-10"
      >
        <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-3xl shadow-2xl p-8 relative overflow-hidden">
          
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30"
            >
              <Fingerprint className="text-white w-8 h-8" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white tracking-tight">OOMS Access</h1>
            <p className="text-gray-400 text-sm mt-2">Secure verification required</p>
          </div>

          {/* Error Message */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, mb: 0 }}
                animate={{ opacity: 1, height: 'auto', mb: 16 }}
                exit={{ opacity: 0, height: 0, mb: 0 }}
                className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl text-center"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Content */}
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSendOtp}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label htmlFor="pan" className="text-sm font-medium text-gray-300">PAN Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      id="pan"
                      type="text"
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                      className="block w-full pl-11 pr-4 py-3 bg-gray-950/50 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all uppercase"
                      placeholder="ABCDE1234F"
                      required
                      disabled={isSubmitting}
                      autoComplete="off"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !panNumber}
                  className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Continue <ArrowRight className="ml-2 w-4 h-4" />
                    </>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleVerifyOtp}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label htmlFor="otp" className="text-sm font-medium text-gray-300">Enter OTP</label>
                    <button 
                      type="button" 
                      onClick={() => {
                        setStep(1);
                        setError('');
                      }}
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Change PAN
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <KeyRound className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      id="otp"
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3 bg-gray-950/50 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all tracking-widest text-lg"
                      placeholder="••••••"
                      required
                      disabled={isSubmitting}
                      autoComplete="one-time-code"
                      maxLength={6}
                    />
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Code sent to registered mobile for {panNumber}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !otp}
                  className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Verify & Secure Login'
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
          
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
