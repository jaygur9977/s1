import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import ParticleField from '../components/ParticleField';
import { deleteAccount } from '../services/api';

const DeleteAccount = () => {
  const [formData, setFormData] = useState({
    mobile: '',
    password: '',
    uniqueKey: '',
    fourDigitKey: '',
    otp: ''
  });
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (confirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm', {
        style: {
          background: '#1a1a2e',
          color: '#fff',
          border: '1px solid rgba(255,99,71,0.3)',
        },
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      await deleteAccount(formData);
      toast.success('Account deleted successfully', {
        style: {
          background: '#1a1a2e',
          color: '#fff',
          border: '1px solid rgba(152,251,152,0.3)',
        },
      });
      setFormData({ mobile: '', password: '', uniqueKey: '', fourDigitKey: '', otp: '' });
      setStep(1);
      setConfirmText('');
    } catch (error) {
      toast.error('Verification failed. Check all details.', {
        style: {
          background: '#1a1a2e',
          color: '#fff',
          border: '1px solid rgba(255,99,71,0.3)',
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <ParticleField density="low" />
      <Toaster position="top-center" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="relative w-full max-w-md"
      >
        {/* Outer Red Glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 via-pink-500/20 to-orange-500/20 rounded-3xl blur-xl" />
        
        {/* Main Box */}
        <div className="relative bg-[#0a0a1a]/90 backdrop-blur-2xl rounded-2xl border border-red-500/20 shadow-2xl overflow-hidden">
          
          {/* Top Gradient Bar */}
          <div className="h-1 bg-gradient-to-r from-red-500 via-pink-500 to-orange-500" />
          
          {/* Header */}
          <div className="p-6 pb-4 text-center">
            <motion.div
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="text-4xl mb-2">⚠️</div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-red-300 via-pink-300 to-orange-300 bg-clip-text text-transparent">
                Delete Account
              </h2>
              <p className="text-white/40 text-sm mt-1">This action cannot be undone</p>
            </motion.div>

            {/* Step Indicators */}
            <div className="flex justify-center space-x-2 mt-4 mb-2">
              {[1, 2, 3].map((s) => (
                <motion.div
                  key={s}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    s <= step ? 'w-8 bg-gradient-to-r from-red-400 to-pink-400' : 'w-4 bg-white/10'
                  }`}
                  animate={s === step ? { scale: [1, 1.2, 1] } : {}}
                />
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-4">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-white/60 text-sm font-medium mb-1.5">Mobile Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="Registered mobile number"
                      className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-all duration-300"
                      value={formData.mobile}
                      onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-white/60 text-sm font-medium mb-1.5">Password</label>
                    <input
                      type="password"
                      required
                      placeholder="Enter password"
                      className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-all duration-300"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                  </div>

                  <motion.button
                    type="button"
                    onClick={nextStep}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-red-500/20 transition-all duration-300"
                  >
                    Continue
                  </motion.button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-white/60 text-sm font-medium mb-1.5">Unique Key (8-digit)</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter unique key"
                      className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-all duration-300 font-mono"
                      value={formData.uniqueKey}
                      onChange={(e) => setFormData({...formData, uniqueKey: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-white/60 text-sm font-medium mb-1.5">4-Digit Key</label>
                    <input
                      type="text"
                      required
                      maxLength="4"
                      placeholder="Enter 4-digit key"
                      className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-all duration-300 font-mono"
                      value={formData.fourDigitKey}
                      onChange={(e) => setFormData({...formData, fourDigitKey: e.target.value})}
                    />
                  </div>

                  <div className="flex space-x-3">
                    <motion.button
                      type="button"
                      onClick={prevStep}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 py-3 bg-white/5 border border-white/10 text-white/60 rounded-xl hover:bg-white/10 transition-all"
                    >
                      Back
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={nextStep}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-pink-500/20 transition-all"
                    >
                      Continue
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  className="space-y-4"
                >
                  {/* Warning Box */}
                  <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20">
                    <p className="text-red-300/70 text-xs">
                      ⚠️ All your data will be permanently deleted. This cannot be undone.
                    </p>
                  </div>

                  <div>
                    <label className="block text-white/60 text-sm font-medium mb-1.5">OTP Verification</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter OTP (dummy: 12345)"
                      className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-all duration-300"
                      value={formData.otp}
                      onChange={(e) => setFormData({...formData, otp: e.target.value})}
                    />
                    <p className="text-white/20 text-xs mt-1">Demo OTP: 12345</p>
                  </div>

                  <div>
                    <label className="block text-white/60 text-sm font-medium mb-1.5">
                      Type <span className="text-red-400 font-bold">DELETE</span> to confirm
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Type DELETE"
                      className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-all duration-300"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                    />
                  </div>

                  <div className="flex space-x-3">
                    <motion.button
                      type="button"
                      onClick={prevStep}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 py-3 bg-white/5 border border-white/10 text-white/60 rounded-xl hover:bg-white/10 transition-all"
                    >
                      Back
                    </motion.button>
                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-red-500/30 transition-all disabled:opacity-50"
                    >
                      {isLoading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mx-auto"
                        />
                      ) : (
                        'Delete Account'
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default DeleteAccount;