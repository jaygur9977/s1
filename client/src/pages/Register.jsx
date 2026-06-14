import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { registerUser } from '../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    password: ''
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    toast.promise(
      registerUser(formData),
      {
        loading: 'Creating your account...',
        success: (data) => {
          toast('⚠️ IMPORTANT: Save your credentials! You\'ll need them to login and delete account!', {
            duration: 5000,
            icon: '🔐',
          });
          navigate('/congratulations', { state: { ...formData, ...data } });
          return 'Registration successful!';
        },
        error: 'Registration failed. Please try again.',
      }
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen flex items-center justify-center p-4"
    >
      <Toaster position="top-center" />
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="glass-morphism rounded-3xl p-8 max-w-md w-full card-hover"
      >
        <motion.h2 
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent"
        >
          Create Account
        </motion.h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <label className="block text-gray-700 font-semibold mb-2">Name</label>
            <input
              type="text"
              required
              className="input-premium w-full px-4 py-3 rounded-xl"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </motion.div>

          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <label className="block text-gray-700 font-semibold mb-2">Mobile Number</label>
            <input
              type="tel"
              required
              className="input-premium w-full px-4 py-3 rounded-xl"
              value={formData.mobile}
              onChange={(e) => setFormData({...formData, mobile: e.target.value})}
            />
          </motion.div>

          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <label className="block text-gray-700 font-semibold mb-2">Password</label>
            <input
              type="password"
              required
              className="input-premium w-full px-4 py-3 rounded-xl"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg"
          >
            <p className="text-yellow-700 text-sm">
              ⚠️ <strong>IMPORTANT:</strong> After registration, you'll receive a Unique Key and 4-Digit Key. 
              <strong className="block mt-1">You MUST save these to login and delete your account!</strong>
            </p>
          </motion.div>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-premium w-full text-white font-bold py-4 rounded-xl text-lg"
          >
            Register Now
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default Register;