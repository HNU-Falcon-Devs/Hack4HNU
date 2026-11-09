import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useCompetitionTimer } from '../hooks/useCompetitionTimer';
import TeamAnalyticsCharts from '../components/TeamAnalyticsCharts';

export default function ParticipantDashboard({ user }) {
  const [data, setData] = useState(null);
  const { formatted, isExpired, isRunning, hours, minutes, seconds } = useCompetitionTimer(25200);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const res = await api.getDashboard();
    setData(res);
  };

  const teamName = data?.team?.name || user?.team_name || 'Team Alpha';

  return (
    <div className="space-y-6">

      {/* ── Big Competition Countdown Timer ────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm text-center relative overflow-hidden">
        
        {/* Top Green & Yellow dual stripe */}
        <div className="w-full">
          <div className="h-1 bg-[#006633]" />
          <div className="h-0.5 bg-[#eab308]" />
        </div>

        <div className="p-6 sm:p-10">
          {/* Top Meta info: Team & Status */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-slate-100">
            <div className="text-left">
              <span className="text-[11px] font-mono uppercase tracking-widest text-slate-500 font-bold block">
                Participant Dashboard
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {teamName}
              </h1>
            </div>

            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase border ${
                isExpired
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : isRunning
                  ? 'bg-emerald-50 border-emerald-200 text-[#006633]'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                {isExpired ? 'Contest Concluded' : isRunning ? 'Timer Active' : 'Timer Paused'}
              </span>
            </div>
          </div>

          {/* Large Digital Clock Display */}
          <div className="py-8 sm:py-10 flex flex-col items-center justify-center">
            <div className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-widest text-slate-500 mb-2">
              Competition Time Remaining
            </div>

            <div className={`text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black font-mono tracking-wider select-none ${
              isExpired
                ? 'text-rose-600'
                : isRunning
                ? 'text-[#006633]'
                : 'text-[#eab308]'
            }`}>
              {formatted}
            </div>

            {/* Time Block Breakdown (Hours / Minutes / Seconds) */}
            <div className="grid grid-cols-3 gap-3 sm:gap-6 mt-6 max-w-md w-full">
              <div className="bg-slate-50 border border-slate-200 rounded-xl py-3 px-2">
                <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 block">
                  {String(hours).padStart(2, '0')}
                </span>
                <span className="text-[10px] sm:text-[11px] font-mono text-slate-500 uppercase tracking-wider font-semibold">
                  Hours
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl py-3 px-2">
                <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 block">
                  {String(minutes).padStart(2, '0')}
                </span>
                <span className="text-[10px] sm:text-[11px] font-mono text-slate-500 uppercase tracking-wider font-semibold">
                  Minutes
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl py-3 px-2">
                <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 block">
                  {String(seconds).padStart(2, '0')}
                </span>
                <span className="text-[10px] sm:text-[11px] font-mono text-slate-500 uppercase tracking-wider font-semibold">
                  Seconds
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── Team Analytics: Flag Accuracy & Submission Volume Timeline ── */}
      <TeamAnalyticsCharts charts={data?.charts} />

    </div>
  );
}
