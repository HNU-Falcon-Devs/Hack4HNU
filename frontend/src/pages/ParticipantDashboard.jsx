import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useCompetitionTimer } from '../hooks/useCompetitionTimer';
import TeamAnalyticsCharts from '../components/TeamAnalyticsCharts';
import LoadingScreen from '../components/LoadingScreen';

export default function ParticipantDashboard({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { formatted, isExpired, isRunning, hours, minutes, seconds } = useCompetitionTimer(25200);

  useEffect(() => {
    loadDashboard();
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const loadDashboard = async () => {
    const res = await api.getDashboard();
    setData(res);
  };

  if (loading) {
    return (
      <LoadingScreen
        message="Entering Participant Dashboard..."
        subtitle="Loading competition clock & team statistics..."
      />
    );
  }

  const teamName = data?.team?.name || user?.team_name || 'Team Alpha';

  return (
    <div className="space-y-6">

      {/* ── Big Competition Countdown Timer ────────────────────────── */}
      <div className="bg-[#1a2234] border border-[#26334a] rounded-2xl p-6 sm:p-10 shadow-xl text-center relative overflow-hidden">
        
        {/* Top Meta info: Team & Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-[#26334a]/80">
          <div className="text-left">
            <span className="text-[11px] font-mono uppercase tracking-widest text-gray-400 font-bold block">
              Participant Dashboard
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {teamName}
            </h1>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase border ${
              isExpired
                ? 'bg-rose-950/60 border-rose-800 text-rose-400'
                : isRunning
                ? 'bg-emerald-950/60 border-emerald-800 text-[#10B981]'
                : 'bg-amber-950/60 border-amber-800 text-[#F59E0B]'
            }`}>
              {isExpired ? 'Contest Concluded' : isRunning ? 'Timer Active' : 'Timer Paused'}
            </span>
          </div>
        </div>

        {/* Large Digital Clock Display */}
        <div className="py-8 sm:py-10 flex flex-col items-center justify-center">
          <div className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-widest text-gray-400 mb-2">
            Competition Time Remaining
          </div>

          <div className={`text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black font-mono tracking-wider select-none ${
            isExpired
              ? 'text-rose-500'
              : isRunning
              ? 'text-[#10B981] drop-shadow-[0_0_35px_rgba(16,185,129,0.25)]'
              : 'text-[#F59E0B]'
          }`}>
            {formatted}
          </div>

          {/* Time Block Breakdown (Hours / Minutes / Seconds) */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 mt-6 max-w-md w-full">
            <div className="bg-[#121722] border border-[#26334a] rounded-xl py-3 px-2">
              <span className="text-xl sm:text-2xl font-black font-mono text-white block">
                {String(hours).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-[11px] font-mono text-gray-400 uppercase tracking-wider">
                Hours
              </span>
            </div>

            <div className="bg-[#121722] border border-[#26334a] rounded-xl py-3 px-2">
              <span className="text-xl sm:text-2xl font-black font-mono text-white block">
                {String(minutes).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-[11px] font-mono text-gray-400 uppercase tracking-wider">
                Minutes
              </span>
            </div>

            <div className="bg-[#121722] border border-[#26334a] rounded-xl py-3 px-2">
              <span className="text-xl sm:text-2xl font-black font-mono text-white block">
                {String(seconds).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-[11px] font-mono text-gray-400 uppercase tracking-wider">
                Seconds
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* ── Team Analytics: Flag Accuracy & Submission Volume Timeline ── */}
      <TeamAnalyticsCharts charts={data?.charts} />

    </div>
  );
}
