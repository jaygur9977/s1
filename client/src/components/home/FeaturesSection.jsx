import React from 'react';
import { featuresList } from '../../data/features';
import AnimatedCard from '../common/AnimatedCard';

const FeaturesSection = () => {
  return (
    <section id="features" className="relative py-20 px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/4 w-80 h-80 bg-blue-50/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-50/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-100 rounded-full px-5 py-1.5 mb-4 shadow-sm">
            <span className="text-xl">✨</span>
            <span className="text-sm font-semibold text-blue-700">Why Choose Tar-Fence</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-4">
            Powerful <span className="text-blue-600">Features</span>
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Everything you need for a secure, personalized browsing experience. 
            No compromises, pure privacy.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuresList.map((feature) => (
            <div key={feature.id} className="relative">
              <AnimatedCard 
                hover={true} 
                glow={true}
                className="h-full group cursor-pointer border border-slate-100/80 bg-white/70 backdrop-blur-sm"
              >
                {/* Feature Icon */}
                <div className="relative mb-6">
                  <div 
                    className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl transform transition-all duration-300 group-hover:scale-105"
                    style={{
                      background: `linear-gradient(135deg, ${feature.color}15, ${feature.color}25)`,
                    }}
                  >
                    {feature.icon}
                  </div>
                </div>

                {/* Feature Title */}
                <h3 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                  {feature.title}
                </h3>

                {/* Feature Description */}
                <p className="text-slate-600 leading-relaxed text-sm">
                  {feature.description}
                </p>

                {/* Hover Indicator */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                  <span className="text-xl text-blue-600">→</span>
                </div>
              </AnimatedCard>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center space-x-3 bg-blue-50/50 border border-blue-100 rounded-2xl px-6 py-3.5 shadow-sm">
            <span className="text-xl">🔒</span>
            <p className="text-slate-700 font-medium text-sm">
              All features protected by <span className="font-bold text-blue-600">Z+ End-to-End Encryption</span>
            </p>
            <span className="text-xl">🛡️</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;