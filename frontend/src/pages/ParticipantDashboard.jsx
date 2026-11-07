import React, { useEffect, useState } from 'react';
import { 
  Flag, Trophy, CheckCircle, CircleSlash, Award, Activity, Bell, 
  ArrowRight, Shield, Zap, Sparkles, Crosshair, Users, ChevronRight,
  Clock, Lock, ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';
import { useCompetitionTimer } from '../hooks/useCompetitionTimer';
import TeamAnalyticsCharts from '../components/TeamAnalyticsCharts';

const CATEGORY_META = [
  { name: 'WEB', label: 'Web Exploitation', count: 4, score: 400, color: '#F59E0B', badgeBg: 'bg-[#10B981]' },
  { name: 'OSINT', label: 'Open Source Intel', count: 7, score: 430, color: '#10B981', badgeBg: 'bg-[#06B6D4]' },
  { name: 'NETWORK', label: 'Packet & Traffic', count: 3, score: 180, color: '#F59E0B', badgeBg: 'bg-[#8B5CF6]' },
  { name: 'FORENSICS', label: 'Digital Forensics', count: 1, score: 20, color: '#10B981', badgeBg: 'bg-[#10B981]' },
  { name: 'STEGANOGRAPHY', label: 'Steganography', count: 3, score: 220, color: '#F59E0B', badgeBg: 'bg-[#F59E0B]' },
  { name: 'MISCELLANEOUS', label: 'Misc & Crypto', count: 4, score: 260, color: '#10B981', badgeBg: 'bg-[#34D399]' },
];

export default function ParticipantDashboard({ user, onNavigateToChallenges, onNavigateToLeaderboard }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('WEB');
  const { formatted, isExpired, hours, minutes, seconds } = useCompetitionTimer(25200);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    const res = await api.getDashboard();
    setData(res);
    setLoading(false);
  };

  const team = data?.team || {
    name: user?.team_name || 'Team Alpha',
    total_points: 0,
    solved_count: 0,
    unsolved_count: 22,
    members: [
      { username: user?.username || 'cyberspartan', points: 0, solves: 0 },
      { username: 'alpha_hunter', points: 0, solves: 0 },
      { username: 'alpha_sentry', points: 0, solves: 0 },
      { username: 'alpha_vanguard', points: 0, solves: 0 },
    ]
  };

  const stats = data?.stats || {
    total_challenges: 22,
    solved_challenges: team.solved_count || 0,
    unsolved_challenges: 22,
    total_points: team.total_points || 0
  };

  const recentActivity = data?.recent_activity || [];
  const announcements = data?.announcements || [];

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Team Identity + Prominent 7-Hour Competition Countdown Clock */}
      <div className="bg-[#1a2234] border border-[#26334a] rounded-2xl p-5 sm:p-6 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        
        {/* Left: Team Greeting & 4-Member Badge */}
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#059669] to-[#10B981] flex items-center justify-center font-black text-xl text-white shadow-lg shadow-emerald-950/50 shrink-0">
            {team.name ? team.name.charAt(0).toUpperCase() : 'T'}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {team.name}
              </h1>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#101522] text-[#10B981] border border-emerald-800/80 font-bold uppercase tracking-wider">
                4 Participants
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#101522] text-[#F59E0B] border border-[#26334a]">
                User: {user?.username}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1 font-sans">
              Holy Name University Cyber Arena • Team challenges solved are recognized across all 4 teammates.
            </p>
          </div>
        </div>

        {/* Center/Right: 7-Hour Live Competition Timer Widget & Score */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Prominent 7-Hour Timer Card */}
          <div className="bg-[#101522] border border-[#26334a] px-5 py-2.5 rounded-xl shadow-inner flex flex-col justify-center">
            <div className="text-[9px] uppercase font-mono tracking-widest text-gray-400 font-bold">
              <span>7-Hour Contest Time</span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-[#10B981] tracking-wider">
              {isExpired ? '00:00:00' : formatted}
            </div>
          </div>

          {/* Team Total Score */}
          <div className="bg-[#121722] border border-[#26334a] px-4 py-2.5 rounded-xl text-right min-w-[110px]">
            <div className="text-[10px] uppercase font-mono text-gray-400 font-semibold">Team Score</div>
            <div className="text-xl sm:text-2xl font-black font-mono text-[#F59E0B]">
              {team.total_points} <span className="text-xs text-gray-400">PTS</span>
            </div>
          </div>

          <button
            onClick={onNavigateToChallenges}
            className="bg-gradient-to-r from-[#059669] to-[#10B981] hover:from-[#047857] hover:to-[#059669] text-white font-bold px-4 py-3 rounded-xl text-xs transition shadow-md shadow-emerald-900/30 flex items-center space-x-2"
          >
            <span>Browse Challenges</span>
          </button>
        </div>

      </div>

      {/* Main Two-Column Layout (Matching the Reference UI) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (4 Cols): Dynamics of Problem Solving / Live Team Solve Feed */}
        <div className="lg:col-span-4 bg-[#1a2234] border border-[#26334a] rounded-2xl p-4 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#26334a]">
            <div className="flex items-center space-x-2">
              <h2 className="text-xs font-black uppercase tracking-wider text-white">
                Dynamics of Problem Solving
              </h2>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-900">
              Team Solves
            </span>
          </div>

          <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
            {recentActivity.length === 0 ? (
              <div className="text-center py-16 text-gray-400 font-mono text-xs">
                <p>No problem solved by your team yet.</p>
                <p className="text-[11px] text-gray-500 mt-1">Submit flags to populate this feed!</p>
              </div>
            ) : (
              recentActivity.map((act, i) => (
                <div 
                  key={i}
                  className="p-3 rounded-xl bg-[#121722] border border-[#26334a]/80 hover:border-[#10B981]/50 transition flex items-start justify-between gap-3 text-xs"
                >
                  <div className="flex items-start space-x-2.5">
                    <div className="w-6 h-6 rounded-lg bg-[#1a2234] border border-[#26334a] flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-mono text-[#F59E0B] font-bold">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-gray-200 leading-snug">
                        <span className="font-bold text-white">
                          {act.username || user?.username}
                        </span> {act.username === user?.username ? '(You)' : ''} solved a problem and scored <span className="text-[#10B981] font-bold">+{act.points_awarded || 100}</span> points
                      </p>
                      <p className="text-[10px] text-gray-400 font-mono mt-1 flex items-center space-x-1.5">
                        <span className="text-[#F59E0B] font-semibold">{act.challenge_title}</span>
                        <span>•</span>
                        <span>{act.category}</span>
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400 shrink-0">
                    {act.submitted_at?.slice(11, 16) || '21:00'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column (8 Cols): Categories Grid + Bottom 3 Structured Panels */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Category Cards Grid (Exact Style from Reference Image) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
            {CATEGORY_META.map((cat) => {
              const isSelected = selectedCategory === cat.name;
              return (
                <div
                  key={cat.name}
                  onClick={() => {
                    setSelectedCategory(cat.name);
                    onNavigateToChallenges();
                  }}
                  className={`relative bg-[#1a2234] border rounded-2xl p-4 cursor-pointer transition shadow-md flex flex-col justify-between h-28 group ${
                    isSelected 
                      ? 'border-[#10B981] shadow-[0_0_18px_rgba(16,185,129,0.22)] bg-[#1e283d]' 
                      : 'border-[#26334a] hover:border-[#384968] hover:bg-[#1e273a]'
                  }`}
                >
                  {/* Category Title in Bold Gold / Emerald */}
                  <div>
                    <h3 
                      className="text-base font-black tracking-wider uppercase transition"
                      style={{ color: cat.color }}
                    >
                      {cat.name}
                    </h3>
                    <p className="text-[11px] text-gray-300 font-medium mt-1">
                      {cat.count} Questions
                    </p>
                    <p className="text-[10px] text-gray-400 font-mono">
                      Total score: {cat.score}
                    </p>
                  </div>

                  {/* Circular Bottom Right Badge from Reference Image */}
                  <div className="absolute bottom-3 right-3">
                    <div className={`w-6 h-6 rounded-full ${cat.badgeBg} text-slate-950 font-black text-[11px] flex items-center justify-center shadow-md`}>
                      {cat.count}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom 3 Structured Panels (Notice, Team Members Roster, Team Solved Progress) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* 1. Notice Panel (Solid Gold Header Bar from Reference UI) */}
            <div className="bg-[#1a2234] border border-[#26334a] rounded-2xl shadow-md overflow-hidden flex flex-col">
              <div className="bg-[#F59E0B] text-slate-950 px-4 py-2.5 flex items-center justify-between font-black text-xs">
                <div className="flex items-center space-x-2">
                  <span>Notice</span>
                </div>
                <span className="bg-slate-950 text-[#F59E0B] px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">
                  {announcements.length}
                </span>
              </div>

              <div className="p-3.5 space-y-3 flex-1 overflow-y-auto max-h-56">
                {announcements.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6 font-mono">No active notices.</p>
                ) : (
                  announcements.map((ann, idx) => (
                    <div key={idx} className="border-b border-[#26334a]/80 pb-2.5 last:border-none last:pb-0">
                      <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono mb-1">
                        <span className="text-[#10B981] font-semibold">{ann.category}</span>
                        <span>{ann.created_at?.slice(5, 10)}</span>
                      </div>
                      <h4 className="text-xs font-bold text-white line-clamp-1">{ann.title}</h4>
                      <p className="text-[11px] text-gray-300 line-clamp-2 mt-0.5 leading-relaxed">
                        {ann.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 2. Team Members Panel (Solid Green Header Bar - Strictly the 4 Participants of this Team) */}
            <div className="bg-[#1a2234] border border-[#26334a] rounded-2xl shadow-md overflow-hidden flex flex-col">
              <div className="bg-[#059669] text-white px-4 py-2.5 flex items-center justify-between font-black text-xs">
                <div className="flex items-center space-x-2">
                  <span>Team Members (4)</span>
                </div>
                <span className="bg-[#047857] text-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-mono">
                  Points
                </span>
              </div>

              <div className="p-3.5 space-y-2.5 flex-1 overflow-y-auto max-h-56">
                {team.members.map((member, idx) => {
                  const isMe = member.username === user?.username;
                  return (
                    <div 
                      key={idx} 
                      className={`flex items-center justify-between text-xs py-1.5 px-2 rounded-lg border ${
                        isMe 
                          ? 'bg-emerald-950/40 border-emerald-700/60 font-semibold' 
                          : 'border-transparent hover:bg-[#121722]'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <span className="font-mono text-[10px] font-bold text-[#F59E0B] w-7">
                          M{idx + 1}
                        </span>
                        <div className="truncate">
                          <span className={`truncate text-white ${isMe ? 'text-[#10B981] font-bold' : ''}`}>
                            {member.username}
                          </span>
                          {isMe && (
                            <span className="ml-1 text-[9px] px-1.5 py-0.2 rounded bg-emerald-900 text-emerald-300 font-mono">
                              YOU
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right font-mono text-[11px] shrink-0">
                        <span className="text-[#10B981] font-bold">+{member.points || 0}</span>
                        <span className="text-gray-400 text-[9px] block">{member.solves || 0} solves</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Team Progress & Status Panel (Dark Slate / Gold Header Bar from Reference UI) */}
            <div className="bg-[#1a2234] border border-[#26334a] rounded-2xl shadow-md overflow-hidden flex flex-col">
              <div className="bg-[#232d42] text-[#F59E0B] px-4 py-2.5 flex items-center justify-between font-black text-xs border-b border-[#26334a]">
                <div className="flex items-center space-x-2">
                  <span>Team Progress</span>
                </div>
                <span className="text-white text-[11px] font-mono font-bold">
                  {team.total_points} PTS
                </span>
              </div>

              <div className="p-4 space-y-3 flex-1 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-[#26334a]/60">
                  <span className="text-gray-400">Team Solved</span>
                  <span className="font-mono font-bold text-[#10B981]">
                    {team.solved_count} / {stats.total_challenges}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-[#26334a]/60">
                  <span className="text-gray-400">Unsolved Left</span>
                  <span className="font-mono font-bold text-[#F59E0B]">
                    {team.unsolved_count} challenges
                  </span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-400">Team Completion</span>
                  <span className="font-mono font-bold text-white">
                    {stats.total_challenges > 0 ? Math.round((team.solved_count / stats.total_challenges) * 100) : 0}%
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    onClick={onNavigateToLeaderboard}
                    className="w-full bg-[#121722] hover:bg-[#1f283a] text-gray-200 border border-[#26334a] py-2 rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-1.5"
                  >
                    <span>View Team Standings</span>
                  </button>
                  <p className="text-[10px] text-gray-500 text-center font-mono mt-1.5 flex items-center justify-center space-x-1">
                    <span>Competitor scores confidential</span>
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Team Submission Analytics (Flag Accuracy & Submission Volume Timeline) */}
      <TeamAnalyticsCharts charts={data?.charts} />

    </div>
  );
}
