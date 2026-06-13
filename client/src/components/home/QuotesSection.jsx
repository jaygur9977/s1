import React from 'react';
import { securityQuotes, brandTagline } from '../../data/quotes';
import AnimatedCard from '../common/AnimatedCard';

const QuotesSection = () => {
  return (
    <section className="relative py-20 px-4 bg-gradient-to-b from-transparent via-slate-50 to-transparent">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-100/30 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-slate-105/50 rounded-full px-4 py-1.5 mb-4 border border-slate-200/60">
            <span className="text-sm font-semibold text-slate-500">{brandTagline}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">
            Security & Privacy <span className="text-blue-600">Principles</span>
          </h2>
          <p className="mt-4 text-slate-500 max-w-2xl mx-auto">
            Our technology is built upon strict security protocols and zero-knowledge architecture to guarantee complete isolation.
          </p>
        </div>

        {/* Quotes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {securityQuotes.map((item) => (
            <AnimatedCard
              key={item.id}
              hover={true}
              glow={true}
              className="relative p-8 border border-slate-100/85 bg-white/70 backdrop-blur-sm shadow-sm flex flex-col justify-between h-full"
            >
              <div>
                {/* Icon Circle */}
                <div className="w-12 h-12 rounded-xl bg-blue-50/50 flex items-center justify-center text-2xl mb-6 shadow-sm border border-blue-100/60">
                  {item.icon}
                </div>
                {/* Quote Text */}
                <blockquote className="text-slate-700 text-lg italic leading-relaxed mb-6">
                  "{item.quote}"
                </blockquote>
              </div>
              {/* Author / Protocol */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-auto">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  {item.author}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Protocol Rule #0{item.id}
                </span>
              </div>
            </AnimatedCard>
          ))}
        </div>
      </div>
    </section>
  );
};

export default QuotesSection;