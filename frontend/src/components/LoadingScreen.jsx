import React from 'react';
import hnuLogo from '../assets/hnu-logo.png';

export default function LoadingScreen({ 
  message = 'Entering Dashboard...', 
  subtitle = 'Initializing tournament environment...' 
}) {
  return (
    <div className="fixed inset-0 z-50 bg-[#121722] flex flex-col items-center justify-center p-4 selection:bg-emerald-500/30">
      
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(255,255,255,0))] pointer-events-none" />

      <div className="relative flex flex-col items-center space-y-6 max-w-sm w-full text-center z-10">

        {/* Brand Logo Box */}
        <div className="w-24 h-24 rounded-2xl bg-[#1a2234] border border-[#26334a] p-3 shadow-2xl shadow-emerald-950/40 flex items-center justify-center">
          <img
            src={hnuLogo}
            alt="Holy Name University Logo"
            className="w-full h-full object-contain filter drop-shadow-[0_2px_10px_rgba(16,185,129,0.35)] animate-pulse"
          />
        </div>

        {/* Loading text and spinner */}
        <div className="space-y-2">
          <div className="flex items-center justify-center space-x-2.5">
            <div className="w-4 h-4 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
            <h2 className="text-sm font-mono font-bold tracking-wider text-white uppercase">
              {message}
            </h2>
          </div>
          <p className="text-xs font-mono text-gray-400">
            {subtitle}
          </p>
        </div>

        {/* 2-Second Smooth Progress Bar */}
        <div className="w-64 h-1.5 bg-[#1a2234] border border-[#26334a] rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-[#059669] via-[#10B981] to-[#34D399] rounded-full transition-all ease-linear"
            style={{
              animation: 'progressFill 2s ease-in-out forwards'
            }} 
          />
        </div>

      </div>

      <style>{`
        @keyframes progressFill {
          0% { width: 0%; }
          50% { width: 65%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}

