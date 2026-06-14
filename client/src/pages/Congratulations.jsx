import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import ParticleField from '../components/ParticleField';
import DetailCard, { DetailItem, DetailBadge } from '../components/DetailCard';

const Congratulations = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userData = location.state;
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <button onClick={() => navigate('/register')} className="text-pink-400">
          No data found. Go to Register
        </button>
      </div>
    );
  }

  const handleSaveDetails = () => {
    const details = `
=== TAR-FANCE ACCOUNT DETAILS ===
Name: ${userData.name}
Mobile: ${userData.mobile}
Unique Key: ${userData.uniqueKey}
4-Digit Key: ${userData.fourDigitKey}
Password: [Your Password]
================================
IMPORTANT: Save these to login & delete account!
    `;
    
    const blob = new Blob([details], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'TarFance_Account_Details.txt';
    a.click();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <ParticleField density="high" />
      <Toaster position="top-center" />
      
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: -20,
                background: ['#FFB6C1', '#E6E6FA', '#98FB98', '#87CEEB', '#FFD700'][Math.floor(Math.random() * 5)],
              }}
              animate={{
                y: [0, window.innerHeight + 100],
                x: [0, (Math.random() - 0.5) * 200],
                rotate: [0, Math.random() * 720],
                opacity: [1, 0],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                delay: Math.random() * 2,
                repeat: Infinity,
                ease: "easeIn",
              }}
            />
          ))}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative w-full max-w-2xl"
      >
        {/* Outer Glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-green-500/20 rounded-3xl blur-xl" />
        
        {/* Main Box */}
        <div className="relative bg-[#0a0a1a]/90 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
          
          {/* Top Gradient Bar */}
          <div className="h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-green-500" />
          
          {/* Header */}
          <div className="p-8 pb-4 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
              className="text-6xl mb-4"
            >
              🎉
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-4xl font-bold bg-gradient-to-r from-pink-300 via-purple-300 to-green-300 bg-clip-text text-transparent"
            >
              Congratulations!
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-white/40 mt-2"
            >
              Your account has been created successfully
            </motion.p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Info Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailCard title="Personal Info" icon="👤" variant="default">
                <DetailItem label="Name" value={userData.name} highlight />
                <DetailItem label="Mobile" value={userData.mobile} />
              </DetailCard>
              
              <DetailCard title="Security Keys" icon="🔐" variant="warning">
                <DetailItem label="Unique Key" value={userData.uniqueKey} highlight />
                <DetailItem label="4-Digit Key" value={userData.fourDigitKey} highlight />
              </DetailCard>
            </div>

            {/* Status Badge */}
            <div className="flex justify-center">
              <DetailBadge variant="success">
                ✅ Account Active
              </DetailBadge>
            </div>

            {/* Critical Warning */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="p-4 rounded-xl bg-red-500/5 border border-red-500/20"
            >
              <div className="flex items-start space-x-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h3 className="text-red-300 font-semibold mb-2">CRITICAL: Save These 3 Items!</h3>
                  <p className="text-red-300/70 text-sm mb-3">
                    You MUST save these to login and delete your account. They cannot be recovered!
                  </p>
                  <ul className="space-y-1.5">
                    {[
                      { icon: '🔒', text: 'Password' },
                      { icon: '🔑', text: `Unique Key: ${userData.uniqueKey}` },
                      { icon: '🔐', text: `4-Digit Key: ${userData.fourDigitKey}` }
                    ].map((item, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.5 + i * 0.2 }}
                        className="flex items-center space-x-2 text-red-200/80 text-sm"
                      >
                        <span>{item.icon}</span>
                        <span className="font-mono">{item.text}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveDetails}
                className="flex-1 py-3.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-pink-500/20 transition-all duration-300"
              >
                💾 Save Details
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.print()}
                className="flex-1 py-3.5 bg-white/5 border border-white/10 text-white/70 font-semibold rounded-xl hover:bg-white/10 transition-all duration-300"
              >
                🖨️ Print Page
              </motion.button>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/5 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-pink-400 hover:text-pink-300 text-sm transition-colors"
            >
              Go to Login →
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Congratulations;