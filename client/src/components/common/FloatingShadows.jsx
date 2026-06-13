import React, { useEffect, useState } from 'react';

const FloatingShadows = () => {
  const [shadows, setShadows] = useState([]);

  useEffect(() => {
    const gradients = [
      'from-amber-200/20 to-orange-100/10', // Skin/peach
      'from-blue-200/20 to-sky-100/10',     // Light Blue
      'from-pink-200/20 to-rose-100/10',     // Light Pink
      'from-emerald-200/20 to-teal-100/10',  // Light Green
      'from-orange-200/15 to-amber-100/5',   // Skin/peach
      'from-sky-200/20 to-blue-100/10',      // Light Blue
      'from-rose-200/20 to-pink-100/10',     // Light Pink
      'from-teal-200/20 to-emerald-100/10',  // Light Green
    ];

    const newShadows = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      gradient: gradients[i],
      width: Math.random() * 250 + 200,
      height: Math.random() * 250 + 200,
      top: Math.random() * 80 + 10,
      left: Math.random() * 80 + 10,
      duration: Math.random() * 30 + 20,
      delay: Math.random() * -25,
      blur: Math.random() * 40 + 40,
    }));

    setShadows(newShadows);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {shadows.map((shadow) => (
        <div
          key={shadow.id}
          className={`absolute rounded-full bg-gradient-to-br ${shadow.gradient}`}
          style={{
            width: `${shadow.width}px`,
            height: `${shadow.height}px`,
            top: `${shadow.top}%`,
            left: `${shadow.left}%`,
            animation: `floatShadow ${shadow.duration}s ${shadow.delay}s infinite ease-in-out`,
            filter: `blur(${shadow.blur}px)`,
          }}
        />
      ))}
      
      <style>{`
        @keyframes floatShadow {
          0%, 100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
            opacity: 0.15;
          }
          25% {
            transform: translate(40px, -20px) scale(1.05) rotate(4deg);
            opacity: 0.22;
          }
          50% {
            transform: translate(-20px, 30px) scale(0.95) rotate(-3deg);
            opacity: 0.12;
          }
          75% {
            transform: translate(30px, 20px) scale(1.08) rotate(5deg);
            opacity: 0.2;
          }
        }
      `}</style>
    </div>
  );
};

export default FloatingShadows;