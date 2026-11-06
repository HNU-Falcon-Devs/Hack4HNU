import React, { useEffect, useState } from 'react';
import { 
  Flag, Trophy, CheckCircle, CircleSlash, Award, Activity, Bell, 
  ArrowRight, Shield, Zap, Sparkles
} from 'lucide-react';
import { api } from '../services/api';

export default function ParticipantDashboard({ user, onNavigateToChallenges, onNavigateToLeaderboard }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    const res = await api.getDashboard();
    setData(res);
    setLoading(false);
  };

  const stats = data?.stats || {
    total_challenges: 22,
    solved_challenges: 0,
    unsolved_challenges: 22,
    total_points: 0,
    rank: 1
  };

  const recentActivity = data?.recent_activity || [];
  const announcements = data?.announcements || [];

  return (
    <div className="space-y-6">
      
      {/* Welcome Hero Banner - PicoCTF inspired */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0E1726] via-[#111C35] to-[#0A1324] border border-[#1E293B] rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_center,rgba(0,212,255,0.12),transparent_70%)] pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Holy Name University Active Arena</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Welcome back, <span className="text-[#00D4FF] font-mono">{user?.username}</span>
          </h1>
          
          <p className="text-sm text-gray-300 leading-relaxed">
            Investigate real cyber forensics captures, OSINT digital footprints, web application vulnerabilities, 
            network traffic dumps, and steganography puzzles. Submit accurate <code className="text-cyan-300 font-mono">HNU&#123;...&#125;</code> flags to climb the leaderboard!
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={onNavigateToChallenges}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono font-semibold px-5 py-2.5 rounded-lg text-sm transition shadow-lg shadow-cyan-500/20 flex items-center space-x-2"
            >
              <span>Explore Challenges</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onNavigateToLeaderboard}
              className="bg-[#1F2937] hover:bg-gray-700/80 text-gray-200 border border-gray-700 font-mono px-4 py-2.5 rounded-lg text-sm transition flex items-center space-x-2"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>View Leaderboard</span>
            </button>
          </div>
        </div>
      </div>

      {/* Key Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        
        {/* Total Available Challenges */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Challenges</span>
            <Flag className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-white">{stats.total_challenges}</div>
          <div className="text-[11px] text-gray-500 font-mono mt-1">Available in arena</div>
        </div>

        {/* Solved Challenges */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Solved</span>
            <CheckCircle className="w-4 h-4 text-green-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-green-400">{stats.solved_challenges}</div>
          <div className="text-[11px] text-gray-500 font-mono mt-1">
            {stats.total_challenges > 0 ? `${Math.round((stats.solved_challenges / stats.total_challenges) * 100)}% completed` : '0%'}
          </div>
        </div>

        {/* Unsolved Challenges */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Unsolved</span>
            <CircleSlash className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-amber-400">{stats.unsolved_challenges}</div>
          <div className="text-[11px] text-gray-500 font-mono mt-1">Awaiting discovery</div>
        </div>

        {/* Total Points */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Total Score</span>
            <Award className="w-4 h-4 text-[#00D4FF]" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-[#00D4FF]">{stats.total_points}</div>
          <div className="text-[11px] text-gray-500 font-mono mt-1">PTS Earned</div>
        </div>

        {/* Current Ranking */}
        <div className="col-span-2 sm:col-span-1 bg-[#111827] border border-[#1E293B] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Rank</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-amber-300">#{stats.rank}</div>
          <div className="text-[11px] text-gray-500 font-mono mt-1">On scoreboard</div>
        </div>

      </div>

      {/* Grid: Recent Activity & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Recent Submissions & Activity */}
        <div className="lg:col-span-2 bg-[#111827] border border-[#1E293B] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-800">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold font-mono text-white uppercase tracking-wider">Recent Activity</h2>
            </div>
            <span className="text-xs text-gray-500 font-mono">Real-time submissions</span>
          </div>

          <div className="space-y-2">
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-gray-500 font-mono text-xs">
                No recent activity recorded yet. Open a challenge to start hunting for flags!
              </div>
            ) : (
              recentActivity.map((act, i) => (
                <div 
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#080D18] border border-gray-800/80"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-1.5 rounded ${act.is_correct ? 'bg-green-950/80 text-green-400' : 'bg-red-950/80 text-red-400'}`}>
                      {act.is_correct ? <CheckCircle className="w-4 h-4" /> : <CircleSlash className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-white">{act.challenge_title}</div>
                      <div className="text-[10px] font-mono text-gray-400">{act.category} • {act.submitted_at}</div>
                    </div>
                  </div>

                  <div className="text-right font-mono text-xs">
                    {act.is_correct ? (
                      <span className="text-green-400 font-bold">+{act.points_awarded} pts</span>
                    ) : (
                      <span className="text-red-400">Failed Attempt</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right 1 Col: Competition Announcements */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-800">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold font-mono text-white uppercase tracking-wider">Announcements</h2>
            </div>
            <span className="text-xs text-cyan-400 font-mono font-semibold">Live</span>
          </div>

          <div className="space-y-3">
            {announcements.length === 0 ? (
              <div className="text-center py-8 text-gray-500 font-mono text-xs">
                No active announcements.
              </div>
            ) : (
              announcements.map((ann, i) => (
                <div key={i} className="p-3 rounded-lg bg-[#080D18] border border-gray-800/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800">
                      {ann.category}
                    </span>
                    <span className="text-[10px] font-mono text-gray-500">{ann.created_at?.slice(0, 10)}</span>
                  </div>
                  <h3 className="text-xs font-bold text-white leading-snug">{ann.title}</h3>
                  <p className="text-[11px] text-gray-300 leading-relaxed line-clamp-3 font-sans">
                    {ann.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

