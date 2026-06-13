import React, { useState } from 'react';
import { howToUseSteps } from '../../data/howToUse';

const HowToUse = () => {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section id="how-to-use" className="relative py-20 px-4">
      <div className="relative max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-100 rounded-full px-5 py-1.5 mb-4 shadow-sm">
            <span className="text-xl">📚</span>
            <span className="text-sm font-semibold text-blue-700">Getting Started</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-4">
            How to <span className="text-blue-600">Create Your Account</span>
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Follow these simple steps to set up your secure sandbox environment. 
            It takes less than 2 minutes!
          </p>
        </div>

        {/* Steps */}
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Step Navigation */}
          <div className="space-y-4">
            {howToUseSteps.map((step, index) => (
              <div
                key={step.step}
                onClick={() => setActiveStep(index)}
                className={`group cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5 ${
                  activeStep === index ? 'scale-[1.01]' : 'scale-100'
                }`}
              >
                <div className={`relative p-6 rounded-2xl transition-all duration-300 border ${
                  activeStep === index
                    ? 'bg-blue-50 border-blue-200 text-slate-800 shadow-sm'
                    : 'bg-white hover:bg-slate-50/50 border-slate-100 shadow-sm text-slate-600'
                }`}>
                  {/* Step Number */}
                  <div className="flex items-start space-x-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                      activeStep === index
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {step.step}
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-base font-bold mb-1 ${
                        activeStep === index ? 'text-slate-850' : 'text-slate-700'
                      }`}>
                        {step.title}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{step.icon}</span>
                        {activeStep === index && (
                          <span className="text-xs text-blue-600 font-semibold">Active Step</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Active Indicator Arrow */}
                  {activeStep === index && (
                    <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-blue-50 border-t border-r border-blue-200 rotate-45 hidden lg:block"></div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Step Details */}
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-8 lg:p-10 sticky top-24 transition-all duration-300">
              {/* Step Content */}
              <div className="space-y-6">
                {/* Step Header */}
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{howToUseSteps[activeStep].icon}</span>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">
                      {howToUseSteps[activeStep].title}
                    </h3>
                    <p className="text-xs text-blue-600 font-semibold">
                      Step {howToUseSteps[activeStep].step} of {howToUseSteps.length}
                    </p>
                  </div>
                </div>

                {/* Step Description */}
                <ul className="space-y-3">
                  {howToUseSteps[activeStep].description.map((item, index) => (
                    <li key={index} className="flex items-start space-x-3 text-slate-650 text-sm">
                      <span className="text-blue-500 mt-1">✦</span>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>

                {/* Pro Tip - Skin / Warm Beige styling */}
                <div className="bg-amber-50/60 rounded-xl p-4 border border-amber-100">
                  <div className="flex items-start space-x-3">
                    <span className="text-xl">💡</span>
                    <div>
                      <p className="text-xs font-bold text-amber-800 mb-1">Pro Tip</p>
                      <p className="text-xs text-slate-700 leading-relaxed">{howToUseSteps[activeStep].tip}</p>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-550"
                    style={{ width: `${((activeStep + 1) / howToUseSteps.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <button
                  onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                  disabled={activeStep === 0}
                  className={`px-5 py-2 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    activeStep === 0
                      ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  ← Previous
                </button>
                <button
                  onClick={() => setActiveStep(Math.min(howToUseSteps.length - 1, activeStep + 1))}
                  disabled={activeStep === howToUseSteps.length - 1}
                  className={`px-5 py-2 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    activeStep === howToUseSteps.length - 1
                      ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                  }`}
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Security Note */}
        <div className="mt-16 text-center">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <span className="text-3xl">🔐</span>
              <div className="text-center sm:text-left flex-1">
                <h4 className="font-bold text-slate-800 text-base">Z+ Security Guaranteed</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Your data is end-to-end encrypted. No one can access it, including us. Privacy first, always.
                </p>
              </div>
              <span className="text-3xl">🛡️</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowToUse;