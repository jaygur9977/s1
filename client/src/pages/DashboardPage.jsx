import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    // Set greeting based on time
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Hide welcome message after 5 seconds
    setTimeout(() => setShowWelcome(false), 5500);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      
      {/* Welcome Toast */}
      {showWelcome && (
        <div className="fixed top-24 right-4 z-50 animate-slide-in">
          <div className="bg-blue-600 text-white rounded-xl shadow-lg p-4 flex items-center space-x-3 border border-blue-500">
            <span className="text-2xl">👋</span>
            <div>
              <p className="font-bold text-sm">Welcome back!</p>
              <p className="text-xs opacity-90">Your sandbox is active</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        
        {/* Dashboard Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-800">
                {greeting}, <span className="text-blue-600 font-black">User</span> 👋
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Your personal sandbox is active and secure
              </p>
            </div>
            
            {/* Time Display */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex items-center space-x-3">
              <span className="text-2xl">🕐</span>
              <div>
                <p className="text-xl font-bold text-slate-800 leading-none">
                  {currentTime.toLocaleTimeString()}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {currentTime.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Status Bar - Light Green styling */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🛡️</span>
              <div>
                <p className="font-bold text-emerald-800 text-sm">Z+ Encryption Active</p>
                <p className="text-xs text-emerald-750">Your connection is secure and encrypted</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-emerald-700 font-bold text-xs">LIVE</span>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Sandbox Status Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-850">Your Sandbox</h3>
              <span className="text-xl">🏰</span>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Status</span>
                <span className="text-emerald-600 font-semibold flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                  <span>Active</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Encryption</span>
                <span className="text-blue-600 font-semibold">Z+ Level</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Created</span>
                <span className="text-slate-800">Just now</span>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-850">Quick Actions</h3>
              <span className="text-xl">⚡</span>
            </div>
            <div className="space-y-1.5 text-sm">
              {[
                { icon: '🔒', text: 'Lock Sandbox', action: () => {} },
                { icon: '📋', text: 'View Logs', action: () => {} },
                { icon: '⚙️', text: 'Settings', action: () => {} },
              ].map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-blue-50/50 transition-colors duration-200 text-left text-slate-750 font-medium"
                >
                  <span>{action.icon}</span>
                  <span>{action.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Security Tips Card - Skin Accent Styling */}
          <div className="bg-amber-50/40 border border-amber-100 rounded-xl shadow-sm p-6 text-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-amber-900 text-sm">Security Tip</h3>
                <span className="text-xl">💡</span>
              </div>
              <p className="text-slate-650 text-xs leading-relaxed">
                Never share your unique key, password, or PIN with anyone. 
                Tar-Fence will never ask for these credentials.
              </p>
            </div>
            <div className="mt-4 flex items-center space-x-2 text-slate-400 text-[10px]">
              <span>🔐</span>
              <span>Updated just now</span>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: '🌍', title: 'Global Access', desc: 'Login from anywhere' },
            { icon: '🔐', title: 'End-to-End Encrypted', desc: 'Maximum security' },
            { icon: '💻', title: 'No Re-login', desc: 'Persistent session' },
            { icon: '🛡️', title: 'Z+ Protection', desc: 'Military grade' },
          ].map((feature, index) => (
            <div key={index} className="bg-white/80 border border-slate-100/60 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 text-center group">
              <span className="text-2xl mb-2 block group-hover:scale-105 transition-transform duration-300">
                {feature.icon}
              </span>
              <h4 className="font-bold text-slate-800 text-sm">{feature.title}</h4>
              <p className="text-xs text-slate-500 mt-1">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Info Message */}
        <div className="bg-blue-50/30 rounded-xl p-6 border border-blue-100 shadow-sm">
          <div className="flex items-start space-x-4">
            <span className="text-3xl">📢</span>
            <div>
              <h3 className="font-bold text-slate-800 text-base mb-2">Welcome to Your Personal Sandbox!</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                This is your secure, isolated environment. Everything you do here is protected 
                with Z+ end-to-end encryption. No one, not even Tar-Fence administrators, 
                can access your data. Feel free to browse, store, and work with complete peace of mind.
              </p>
              <p className="text-slate-400 text-xs mt-3">
                Created by <span className="font-bold text-slate-600">JAY</span> © 2026
              </p>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <div className="text-center mt-8">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 px-6 py-2.5 bg-red-50 text-red-600 font-semibold rounded-lg hover:bg-red-100 transition-colors duration-200 text-sm"
          >
            <span>🚪</span>
            <span>Logout from Sandbox</span>
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default DashboardPage;