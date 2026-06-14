import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import ParticleField from '../components/ParticleField';
import { loginUser } from '../services/api';

const Login = () => {
  const [formData, setFormData] = useState({
    mobile: '',
    password: '',
    uniqueKey: '',
    fourDigitKey: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showKeys, setShowKeys] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const userData = await loginUser(formData);
      toast.success('Welcome back! 🎉', {
        style: {
          background: '#1a1a2e',
          color: '#fff',
          border: '1px solid rgba(152,251,152,0.3)',
        },
      });
      setTimeout(() => navigate('/congratulations', { state: userData }), 500);
    } catch (error) {
      toast.error('Invalid credentials. Please check all fields.', {
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <ParticleField density="medium" />
      <Toaster position="top-center" />
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="relative w-full max-w-md"
      >
        {/* Outer Glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-xl" />
        
        {/* Main Box */}
        <div className="relative bg-[#0a0a1a]/90 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
          
          {/* Top Gradient Bar */}
          <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
          
          {/* Header */}
          <div className="p-6 pb-4 text-center">
            <motion.div
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="text-4xl mb-2">👋</div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                Welcome Back
              </h2>
              <p className="text-white/40 text-sm mt-1">Sign in to your account</p>
            </motion.div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-4">
            {/* Mobile Number */}
            <div>
              <label className="block text-white/60 text-sm font-medium mb-1.5">Mobile Number</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">📱</span>
                <input
                  type="tel"
                  required
                  placeholder="Enter mobile number"
                  className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-all duration-300"
                  value={formData.mobile}
                  onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-white/60 text-sm font-medium mb-1.5">Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">🔒</span>
                <input
                  type="password"
                  required
                  placeholder="Enter password"
                  className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/20 transition-all duration-300"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            {/* Toggle Keys Section */}
            <motion.button
              type="button"
              onClick={() => setShowKeys(!showKeys)}
              className="w-full flex items-center justify-center space-x-2 py-2 text-white/40 hover:text-white/60 text-sm transition-colors"
              whileHover={{ scale: 1.02 }}
            >
              <span>{showKeys ? 'Hide' : 'Show'} Security Keys</span>
              <motion.span
                animate={{ rotate: showKeys ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                ▼
              </motion.span>
            </motion.button>

            {/* Security Keys */}
            <motion.div
              initial={false}
              animate={{ height: showKeys ? 'auto' : 0, opacity: showKeys ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-white/60 text-sm font-medium mb-1.5">Unique Key (8-digit)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">🔑</span>
                    <input
                      type="text"
                      required={showKeys}
                      placeholder="e.g., A1b@2C3d"
                      className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-pink-500/50 focus:outline-none focus:ring-1 focus:ring-pink-500/20 transition-all duration-300 font-mono"
                      value={formData.uniqueKey}
                      onChange={(e) => setFormData({...formData, uniqueKey: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/60 text-sm font-medium mb-1.5">4-Digit Key</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">🔐</span>
                    <input
                      type="text"
                      required={showKeys}
                      maxLength="4"
                      placeholder="e.g., 4829"
                      className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-green-500/50 focus:outline-none focus:ring-1 focus:ring-green-500/20 transition-all duration-300 font-mono"
                      value={formData.fourDigitKey}
                      onChange={(e) => setFormData({...formData, fourDigitKey: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mx-auto"
                />
              ) : (
                'Sign In'
              )}
            </motion.button>
          </form>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/5 text-center">
            <p className="text-white/30 text-xs">
              Don't have an account?{' '}
              <button onClick={() => navigate('/register')} className="text-blue-400 hover:text-blue-300 transition-colors">
                Create one
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;