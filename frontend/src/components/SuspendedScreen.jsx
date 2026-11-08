import React, { useEffect, useState } from 'react';

export default function SuspendedScreen({ 
  initialRemainingSeconds = 1800, 
  reason = "You're suspended for 30mins.... your doing something not in the rules",
  onCheckStatus 
}) {
  const [remaining, setRemaining] = useState(initialRemainingSeconds || 1800);

  // Sync remaining if prop updates
  useEffect(() => {
    if (initialRemainingSeconds > 0) {
      setRemaining(initialRemainingSeconds);
    }
  }, [initialRemainingSeconds]);

  // Tick down every second
  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll backend status periodically to detect when admin unsuspends
  useEffect(() => {
    if (!onCheckStatus) return;
    const poll = setInterval(() => {
      onCheckStatus();
    }, 4000);
    return () => clearInterval(poll);
  }, [onCheckStatus]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl bg-slate-950/85 selection:bg-rose-500/30">
      
      {/* Ambient Red Glow */}
      <div className="absolute w-96 h-96 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Center Warning Card */}
      <div className="relative bg-[#16131c] border-2 border-rose-600/80 rounded-3xl p-6 sm:p-10 max-w-lg w-full text-center shadow-[0_0_60px_rgba(225,29,72,0.4)] space-y-6 z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Badge */}
        <div className="flex items-center justify-center">
          <span className="bg-rose-950/90 border border-rose-600/80 text-rose-300 font-mono text-xs uppercase px-4 py-1.5 rounded-full font-bold tracking-widest animate-pulse">
            DISCIPLINARY ACTION
          </span>
        </div>

        {/* Heading */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
            Account Suspended
          </h1>
          <p className="text-xs font-mono text-rose-400 font-bold uppercase tracking-wider">
            Tournament Policy Violation Detected
          </p>
        </div>

        {/* The Exact Message Required by User */}
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-white font-mono text-sm sm:text-base font-bold leading-relaxed shadow-inner">
          "{reason}"
        </div>

        {/* Countdown Box */}
        <div className="bg-[#0e0c13] border border-rose-900/60 rounded-2xl p-4 flex flex-col items-center justify-center">
          <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 font-bold mb-1">
            Suspension Time Remaining
          </span>
          <div className="text-4xl sm:text-5xl font-black font-mono tracking-widest text-rose-500">
            {formattedTime}
          </div>
          <span className="text-[11px] font-mono text-gray-500 mt-1">
            Minutes : Seconds
          </span>
        </div>

        {/* Informational Subtext */}
        <p className="text-xs text-gray-400 font-sans leading-relaxed">
          Your access to flags, challenges, and team participation is restricted. If you believe this suspension was issued in error, please report to the CTF organizers immediately.
        </p>

      </div>
    </div>
  );
}

