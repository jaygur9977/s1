import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import ParticleField from '../components/ParticleField';
import { registerUser } from '../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    password: ''
  });
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const data = await registerUser(formData);
      toast.success('Registration successful!', {
        style: {
          background: '#1a1a2e',
          color: '#fff',
          border: '1px solid rgba(255,182,193,0.3)',
        },
      });
      
      setTimeout(() => {
        toast('⚠️ Save your credentials! You need them to login & delete account', {
          duration: 6000,
          icon: '🔐',
          style: {
            background: '#1a1a2e',
            color: '#fff',
            border: '1px solid rgba(255,218,185,0.3)',
          },
        });
      }, 1500);
      
      navigate('/congratulations', { state: { ...formData, ...data } });
    } catch (error) {
      toast.error('Registration failed. Please try again.', {
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
      <ParticleField density="medium" />
      <Toaster position="top-center" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="relative w-full max-w-md"
      >
        {/* Outer Glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-green-500/20 rounded-3xl blur-xl" />
        
        {/* Main Box */}
        <div className="relative bg-[#0a0a1a]/90 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
          
          {/* Top Gradient Bar */}
          <div className="h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-green-500" />
          
          {/* Header */}
          <div className="p-6 pb-2">
            <motion.div
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-center"
            >
              <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-300 via-purple-300 to-green-300 bg-clip-text text-transparent">
                Create Account
              </h2>
              <p className="text-white/40 text-sm mt-1">Join our premium platform</p>
            </motion.div>

            {/* Step Indicators */}
            <div className="flex justify-center space-x-2 mt-4 mb-2">
              {[1, 2, 3].map((s) => (
                <motion.div
                  key={s}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    s <= step ? 'w-8 bg-gradient-to-r from-pink-400 to-purple-400' : 'w-4 bg-white/10'
                  }`}
                  animate={s === step ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 1, repeat: s === step ? Infinity : 0 }}
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
                    <label className="block text-white/60 text-sm font-medium mb-1.5">Full Name</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">👤</span>
                      <input
                        type="text"
                        required
                        placeholder="Enter your name"
                        className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-pink-500/50 focus:outline-none focus:ring-1 focus:ring-pink-500/20 transition-all duration-300"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                  </div>

                  <motion.button
                    type="button"
                    onClick={nextStep}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-pink-500/20 transition-all duration-300"
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
                    <label className="block text-white/60 text-sm font-medium mb-1.5">Mobile Number</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">📱</span>
                      <input
                        type="tel"
                        required
                        placeholder="+1 234 567 890"
                        className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/20 transition-all duration-300"
                        value={formData.mobile}
                        onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <motion.button
                      type="button"
                      onClick={prevStep}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 py-3 bg-white/5 border border-white/10 text-white/60 font-semibold rounded-xl hover:bg-white/10 transition-all duration-300"
                    >
                      Back
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={nextStep}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300"
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
                  <div>
                    <label className="block text-white/60 text-sm font-medium mb-1.5">Password</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">🔒</span>
                      <input
                        type="password"
                        required
                        placeholder="Create strong password"
                        className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-green-500/50 focus:outline-none focus:ring-1 focus:ring-green-500/20 transition-all duration-300"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                      />
                    </div>
                  </div>

                  {/* Warning Box */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20"
                  >
                    <div className="flex items-start space-x-2">
                      <span className="text-yellow-400 mt-0.5">⚠️</span>
                      <p className="text-yellow-300/70 text-xs">
                        <strong>Important:</strong> After registration, you'll receive a Unique Key and 4-Digit Key. 
                        <strong className="block mt-1">Save them to login and delete your account!</strong>
                      </p>
                    </div>
                  </motion.div>

                  <div className="flex space-x-3">
                    <motion.button
                      type="button"
                      onClick={prevStep}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 py-3 bg-white/5 border border-white/10 text-white/60 font-semibold rounded-xl hover:bg-white/10 transition-all duration-300"
                    >
                      Back
                    </motion.button>
                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-green-500/20 transition-all duration-300 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mx-auto"
                        />
                      ) : (
                        'Create Account'
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/5 text-center">
            <p className="text-white/30 text-xs">
              Already have an account?{' '}
              <button onClick={() => navigate('/login')} className="text-pink-400 hover:text-pink-300 transition-colors">
                Sign in
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;