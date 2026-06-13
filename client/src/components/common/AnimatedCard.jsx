import React, { useState } from 'react';

const AnimatedCard = ({ 
  children, 
  className = '',
  hover = true,
  glow = false,
  gradient = false,
  padding = true
}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!hover) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientX - rect.top;
    setMousePosition({ x, y });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const glowStyles = glow && isHovered ? {
    background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.08), transparent 70%)`,
  } : {};

  return (
    <div
      className={`
        relative group
        ${gradient ? 'bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-sm' : 'bg-white'}
        ${padding ? 'p-6' : ''}
        rounded-2xl
        shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(59,130,246,0.06)]
        transition-all duration-500
        transform hover:-translate-y-1.5
        ${className}
      `}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Glow Effect */}
      {glow && (
        <div
          className="absolute inset-0 rounded-2xl transition-opacity duration-500 pointer-events-none"
          style={{
            opacity: isHovered ? 1 : 0,
            ...glowStyles,
          }}
        />
      )}

      {/* Border Gradient Animation */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-200 via-emerald-100 to-pink-100 opacity-25 blur-lg"></div>
      </div>

      {/* Shine Effect */}
      {isHovered && (
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.3) 0%, transparent 50%)`,
          }}
        />
      )}

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-gradient-to-r from-blue-200 to-sky-200 rounded-full opacity-0 group-hover:opacity-40 transition-opacity duration-500"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: isHovered ? `particleFloat ${Math.random() * 2 + 1}s ease-in-out infinite` : 'none',
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      <style>{`
        @keyframes particleFloat {
          0%, 100% {
            transform: translateY(0) scale(1);
            opacity: 0;
          }
          50% {
            transform: translateY(-8px) scale(1.2);
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
};

export default AnimatedCard;