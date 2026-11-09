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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/60">

      {/* Center Warning Card */}
      <div className="relative bg-white border-2 border-rose-600 rounded-3xl p-6 sm:p-10 max-w-lg w-full text-center shadow-xl space-y-6 z-10">

        {/* Top Badge */}
        <div className="flex items-center justify-center">
          <span className="bg-rose-100 border border-rose-300 text-rose-700 font-mono text-xs uppercase px-4 py-1.5 rounded-full font-bold tracking-widest">
            DISCIPLINARY ACTION
          </span>
        </div>

        {/* Heading */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">
            Account Suspended
          </h1>
          <p className="text-xs font-mono text-rose-600 font-bold uppercase tracking-wider">
            Competition Policy Violation Detected
          </p>
        </div>

        {/* Informational Subtext */}
        <p className="text-xs text-slate-500 font-sans leading-relaxed">
          Your access to flags, challenges, and team participation is restricted for {formattedTime}. If you believe this suspension was issued in error, please report to the CTF organizers immediately.
        </p>

      </div>
    </div>
  );
}

