import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const HeroSection = () => {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  
  const fullText = "Your Digital Fortress, Your Rules";
  const typingSpeed = 100;

  useEffect(() => {
    let currentIndex = 0;
    let typingInterval;

    if (isTyping) {
      typingInterval = setInterval(() => {
        if (currentIndex <= fullText.length) {
          setDisplayText(fullText.slice(0, currentIndex));
          currentIndex++;
        } else {
          setIsTyping(false);
          clearInterval(typingInterval);
        }
      }, typingSpeed);
    }

    return () => clearInterval(typingInterval);
  }, [isTyping]);

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20">
      {/* Subtle Background Grid */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle, #3B82F6 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          animation: 'gridMove 30s linear infinite'
        }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Content */}
          <div className="space-y-8 text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-1.5 shadow-sm">
              <span className="text-xl">🔐</span>
              <span className="text-sm font-semibold text-blue-700">Z+ End-to-End Encrypted</span>
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-6xl font-black leading-tight text-slate-800">
              Create Your
              <br />
              <span className="relative text-blue-600">
                Personal Sandbox
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 20">
                  <path
                    d="M0 10 Q 50 20, 100 10 T 200 10"
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="4"
                    className="animate-draw"
                  />
                </svg>
              </span>
            </h1>

            {/* Typing Effect */}
            <div className="h-10">
              <p className="text-xl md:text-2xl text-slate-600 font-semibold">
                {displayText}
                <span className="animate-pulse text-blue-600">|</span>
              </p>
            </div>

            {/* Description */}
            <p className="text-lg text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Experience the freedom of a personalized browser environment. 
              No emails, no repeated logins, no hassles. Your data stays encrypted 
              with military-grade Z+ security.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                to="/register"
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <span>Create Your Sandbox</span>
                <span className="text-xl">🚀</span>
              </Link>

              <Link
                to="/login"
                className="px-8 py-4 border-2 border-slate-200 text-slate-700 hover:border-slate-300 font-bold rounded-xl hover:bg-slate-50 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <span>Login to Sandbox</span>
                <span>🔑</span>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap gap-6 justify-center lg:justify-start pt-4">
              {[
                { icon: '⚡', text: 'Instant Setup' },
                { icon: '🔒', text: 'Z+ Encryption' },
                { icon: '🌍', text: 'Access Anywhere' },
                { icon: '💻', text: 'No Re-login' },
              ].map((item, index) => (
                <div key={index} className="flex items-center space-x-2 text-slate-500">
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-sm font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content - Mock Sandbox Window (Light aesthetic with moving shadows) */}
          <div className="hidden lg:block relative">
            <div className="relative w-full p-4">
              {/* Mock Sandbox Window */}
              <div className="w-full bg-white rounded-2xl shadow-xl border border-slate-100/80 overflow-hidden transform hover:scale-[1.01] transition-transform duration-500">
                {/* Window Title Bar */}
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex space-x-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-400/80"></span>
                    <span className="w-3 h-3 rounded-full bg-amber-400/80"></span>
                    <span className="w-3 h-3 rounded-full bg-emerald-400/80"></span>
                  </div>
                  {/* Mock URL Bar */}
                  <div className="bg-slate-100 rounded-lg px-8 py-1 text-xs text-slate-500 font-mono w-2/3 text-center truncate select-none">
                    🔒 sandbox.tar-fence.local/secure-session
                  </div>
                  <div className="w-10"></div>
                </div>
                
                {/* Sandbox Content Area */}
                <div className="p-6 bg-slate-50/30 space-y-4 font-sans text-sm">
                  {/* Header row */}
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-base">Personal Workspace</span>
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                      <span>Z+ Encrypted Connection</span>
                    </span>
                  </div>

                  {/* Quick status cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-1.5 shadow-sm">
                      <span className="text-xs text-slate-400 block font-medium">Session Key</span>
                      <span className="font-mono font-bold text-slate-700 tracking-wider">TF-9K2L-4M8P</span>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-1.5 shadow-sm">
                      <span className="text-xs text-slate-400 block font-medium">Data Protection</span>
                      <span className="font-bold text-emerald-600">Zero Leakage</span>
                    </div>
                  </div>

                  {/* Activity Preview Mock */}
                  <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                      <span>SANDBOX SECURITY SHIELD</span>
                      <span className="text-blue-600 font-bold">100% SECURE</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        All data, cookies, and local session details generated in this workspace are dynamically encrypted using AES-GCM-256 and will be isolated from your host system.
                      </p>
                    </div>
                  </div>

                  {/* Bottom taglines with light pastel colors */}
                  <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-100">
                    <span className="flex items-center space-x-1">
                      <span className="text-blue-500">🌍</span> <span>Isolated Session</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="text-pink-500">🔐</span> <span>Private Node</span>
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Decorative light shadows inside the box */}
              <div className="absolute -top-6 -right-6 w-36 h-36 bg-gradient-to-br from-blue-200/20 to-sky-100/10 rounded-full blur-2xl -z-10 animate-pulse"></div>
              <div className="absolute -bottom-6 -left-6 w-36 h-36 bg-gradient-to-br from-amber-200/20 to-orange-100/10 rounded-full blur-2xl -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(40px, 40px); }
        }
        @keyframes draw {
          to { stroke-dashoffset: 0; }
        }
        .animate-draw {
          stroke-dasharray: 200;
          stroke-dashoffset: 200;
          animation: draw 2s ease forwards;
        }
      `}</style>
    </section>
  );
};

export default HeroSection;