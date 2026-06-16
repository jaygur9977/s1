import React from 'react';
import { motion } from 'framer-motion';

const DetailCard = ({ title, icon, children, variant = 'default' }) => {
  const variants = {
    default: {
      border: 'border-white/[0.08] hover:border-pink-500/30',
      glow: 'rgba(255, 182, 193, 0.15)',
      iconBg: 'from-pink-500/20 to-purple-500/20',
    },
    success: {
      border: 'border-white/[0.08] hover:border-green-500/30',
      glow: 'rgba(152, 251, 152, 0.15)',
      iconBg: 'from-green-500/20 to-emerald-500/20',
    },
    warning: {
      border: 'border-white/[0.08] hover:border-yellow-500/30',
      glow: 'rgba(255, 218, 185, 0.15)',
      iconBg: 'from-yellow-500/20 to-orange-500/20',
    },
    info: {
      border: 'border-white/[0.08] hover:border-blue-500/30',
      glow: 'rgba(135, 206, 235, 0.15)',
      iconBg: 'from-blue-500/20 to-cyan-500/20',
    }
  };

  const currentVariant = variants[variant] || variants.default;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
        y: -4,
        transition: { type: "spring", stiffness: 300 }
      }}
      className="group relative"
    >
      {/* Hover Glow Effect */}
      <motion.div
        className="absolute -inset-2 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${currentVariant.glow}, transparent 70%)`,
          filter: 'blur(20px)',
        }}
      />

      {/* Main Card */}
      <div className={`
        relative p-5 rounded-xl
        bg-white/[0.03] backdrop-blur-xl
        border ${currentVariant.border}
        transition-all duration-300
        overflow-hidden
      `}>
        
        {/* Card Shine Effect */}
        <div 
          className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.2), transparent)',
          }}
        />

        {/* Card Background Pattern */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/10 blur-2xl" />
        </div>

        {/* Header */}
        <div className="relative flex items-center space-x-3 mb-4">
          {/* Icon Container */}
          <motion.div
            className={`
              w-10 h-10 rounded-lg flex items-center justify-center
              bg-gradient-to-br ${currentVariant.iconBg}
              border border-white/10
              shadow-lg
            `}
            whileHover={{ rotate: 5, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <span className="text-xl">{icon}</span>
          </motion.div>

          {/* Title */}
          <div className="flex-1">
            <h3 className="text-base font-semibold text-white/90 tracking-wide">
              {title}
            </h3>
            {/* Animated underline */}
            <motion.div
              className="h-px bg-gradient-to-r from-pink-500/50 to-purple-500/50 mt-0.5"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              style={{ transformOrigin: 'left' }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="relative space-y-2">
          {children}
        </div>

        {/* Corner Accent */}
        <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none">
          <div 
            className="absolute top-2 right-2 w-2 h-2 rounded-full"
            style={{ background: `linear-gradient(135deg, ${currentVariant.glow}, transparent)` }}
          />
          <div 
            className="absolute top-6 right-6 w-1 h-1 rounded-full"
            style={{ background: `linear-gradient(135deg, ${currentVariant.glow}, transparent)` }}
          />
        </div>
      </div>
    </motion.div>
  );
};

// Preset styled content components
export const DetailItem = ({ label, value, highlight = false }) => (
  <motion.div 
    className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/[0.02] transition-colors duration-200"
    whileHover={{ x: 2 }}
  >
    <span className="text-white/40 text-xs font-medium tracking-wide uppercase">
      {label}
    </span>
    <span className={`
      text-sm font-semibold
      ${highlight 
        ? 'bg-gradient-to-r from-pink-300 to-purple-300 bg-clip-text text-transparent' 
        : 'text-white/80'
      }
    `}>
      {value}
    </span>
  </motion.div>
);

export const DetailBadge = ({ children, variant = 'default' }) => {
  const variants = {
    default: 'bg-white/5 border-white/10 text-white/70',
    success: 'bg-green-500/10 border-green-500/20 text-green-300',
    warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300',
    danger: 'bg-red-500/10 border-red-500/20 text-red-300',
  };

  return (
    <span className={`
      inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
      border ${variants[variant] || variants.default}
    `}>
      {children}
    </span>
  );
};

export default DetailCard;