import React from 'react';
import HeroSection from '../components/home/HeroSection';
import QuotesSection from '../components/home/QuotesSection';
import FeaturesSection from '../components/home/FeaturesSection';
import HowToUse from '../components/home/HowToUse';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="pt-20">
      <HeroSection />
      <QuotesSection />
      <FeaturesSection />
      <HowToUse />

      {/* Security Promise Bar */}
      <div className="bg-blue-50 border-y border-blue-100 text-blue-800 py-3.5 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap">
          <span className="mx-8 text-sm font-semibold">🔒 End-to-End Z+ Encrypted</span>
          <span className="mx-8 text-sm font-semibold">⚡ Instant Sandbox Creation</span>
          <span className="mx-8 text-sm font-semibold">🌍 Access From Any Device</span>
          <span className="mx-8 text-sm font-semibold">🔐 Zero Knowledge Architecture</span>
          <span className="mx-8 text-sm font-semibold">🛡️ Military Grade Security</span>
          <span className="mx-8 text-sm font-semibold">💎 No Data Collection</span>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default HomePage;