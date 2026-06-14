import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { to: "/login", label: "Login" },
    { to: "/register", label: "Register" },
    { to: "/delete", label: "Delete Account" }
  ];

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 px-4 py-4"
    >
      <div className="max-w-7xl mx-auto">
        <div className={`
          glass-premium rounded-2xl px-6 py-3
          transition-all duration-500
          ${scrolled ? 'shadow-2xl shadow-black/20' : 'shadow-lg shadow-black/10'}
        `}>
          <div className="flex items-center justify-between">
            {/* Logo - Simple & Clean */}
            <Link to="/" className="flex items-center space-x-1.5 group">
              <span className="text-2xl font-bold text-white tracking-tight">
                T
              </span>
              <motion.span
                animate={{ 
                  rotate: [0, 15, 0, -15, 0],
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3
                }}
                className="text-xl"
              >
                😊
              </motion.span>
              <span className="text-2xl font-bold text-white tracking-tight">
                r-Fance
              </span>
            </Link>

            {/* Navigation Items */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link key={item.to} to={item.to}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      relative px-4 py-2 rounded-xl text-sm font-medium
                      transition-all duration-300
                      ${location.pathname === item.to 
                        ? 'bg-white/10 text-white' 
                        : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                      }
                    `}
                  >
                    {item.label}
                    {location.pathname === item.to && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-white"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </motion.div>
                </Link>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors">
              <div className="w-5 h-4 flex flex-col justify-between">
                <span className="w-full h-0.5 bg-white/70 rounded-full" />
                <span className="w-full h-0.5 bg-white/70 rounded-full" />
                <span className="w-3/4 h-0.5 bg-white/70 rounded-full" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;