import React, { useEffect, useState } from 'react';
import { 
  Trophy, Medal, Award, Search, Users, Clock, CheckCircle, 
  Lock, Shield, ShieldAlert, AlertCircle, Sparkles, Filter
} from 'lucide-react';
import { api } from '../services/api';
import TeamAnalyticsCharts from '../components/TeamAnalyticsCharts';

export default function LeaderboardPage({ currentUser }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminTab, setAdminTab] = useState('teams'); // 'teams' | 'individuals'
  const [search, setSearch] = useState('');

  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    const res = await api.getLeaderboard();
    setData(res);
    setLoading(false);
  };

  const getRankBadge = (rank) => {
    if (rank === 1) {
      return (
        <div className="flex items-center space-x-1 text-[#F59E0B] font-bold font-mono">
          <Trophy className="w-4 h-4 text-[#F59E0B]" />
          <span>#1</span>
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="flex items-center space-x-1 text-slate-300 font-bold font-mono">
          <Medal className="w-4 h-4 text-slate-300" />
          <span>#2</span>
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="flex items-center space-x-1 text-amber-600 font-bold font-mono">
          <Award className="w-4 h-4 text-amber-600" />
          <span>#3</span>
        </div>
      );
    }
    return <span className="font-mono text-gray-400 font-medium">#{rank}</span>;
  };

  // -------------------------------------------------------------
  // PARTICIPANT ISOLATED VIEW (Only My Team & 4 Members)
  // -------------------------------------------------------------
  if (!isAdmin) {
    const team = data?.team || {
      team_name: currentUser?.team_name || 'Team Alpha',
      total_points: 0,
      challenges_solved: 0,
      members: [
        { username: currentUser?.username || 'cyberspartan', points: 0, solves: 0 },
        { username: 'alpha_hunter', points: 0, solves: 0 },
        { username: 'alpha_sentry', points: 0, solves: 0 },
        { username: 'alpha_vanguard', points: 0, solves: 0 },
      ],
      solved_challenges: []
    };

    return (
      <div className="space-y-6">
        
        {/* Header Banner */}
        <div className="bg-[#1a2234] border border-[#26334a] rounded-2xl p-6 sm:p-7 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-[#10B981] font-mono text-xs mb-1 font-bold">
              <Users className="w-4 h-4" />
              <span className="uppercase tracking-wider">HNU CTF • Team Standings</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {team.team_name} Scoreboard
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Real-time score overview and verified challenge solves for your 4-member squad.
            </p>
          </div>

          <div className="bg-[#121722] border border-[#26334a] px-5 py-3 rounded-xl flex items-center space-x-6">
            <div>
              <div className="text-[10px] uppercase font-mono text-gray-400 font-bold">Team Total</div>
              <div className="text-2xl font-black font-mono text-[#F59E0B]">
                {team.total_points} <span className="text-xs text-gray-400">PTS</span>
              </div>
            </div>
            <div className="border-l border-[#26334a] pl-5">
              <div className="text-[10px] uppercase font-mono text-gray-400 font-bold">Solved</div>
              <div className="text-2xl font-black font-mono text-[#10B981]">
                {team.challenges_solved} <span className="text-xs text-gray-400">Flags</span>
              </div>
            </div>
          </div>
        </div>

        {/* Confidentiality Privacy Notice Alert */}
        <div className="bg-[#161f30] border border-[#263b52] rounded-xl p-4 flex items-start space-x-3 text-xs text-gray-300">
          <Lock className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-white uppercase font-mono text-[11px] tracking-wide">
              Confidential Competition Mode Active
            </span>
            <p className="text-gray-300 leading-relaxed font-sans">
              To preserve tournament strategy and fairness, competitor teams' scores are confidential. Only your team's total points, your 4 team participants, and your verified team solves are displayed.
            </p>
          </div>
        </div>

        {/* 4 Team Participants Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-[#F59E0B]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Team Participants (4 Members)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {team.members.map((member, idx) => {
              const isMe = member.username === currentUser?.username;
              return (
                <div 
                  key={idx}
                  className={`bg-[#1a2234] border rounded-2xl p-5 shadow-md flex flex-col justify-between transition ${
                    isMe 
                      ? 'border-[#10B981] bg-gradient-to-b from-[#1a2234] to-[#12241d] shadow-[0_0_15px_rgba(16,185,129,0.18)]' 
                      : 'border-[#26334a] hover:border-[#384968]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#F59E0B]">
                      Member {idx + 1}
                    </span>
                    {isMe && (
                      <span className="text-[10px] font-mono font-bold bg-[#10B981] text-slate-950 px-2 py-0.5 rounded-full">
                        YOU
                      </span>
                    )}
                  </div>

                  <div className="my-3">
                    <h3 className={`text-base font-bold truncate ${isMe ? 'text-[#10B981]' : 'text-white'}`}>
                      {member.username}
                    </h3>
                    <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                      {member.solves} challenges solved
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#26334a] flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono text-gray-400">Contribution</span>
                    <span className="text-base font-mono font-bold text-white">
                      +{member.points} PTS
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Team Analytics (Flag Accuracy & Submission Volume Timeline) */}
        <TeamAnalyticsCharts charts={data?.charts} />

        {/* Challenges Solved by This Team */}
        <div className="bg-[#1a2234] border border-[#26334a] rounded-2xl overflow-hidden shadow-lg space-y-0">
          <div className="px-6 py-4 bg-[#161c2d] border-b border-[#26334a] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-[#10B981]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Challenges Solved by {team.team_name}
              </h3>
            </div>
            <span className="text-xs font-mono text-gray-400">
              {team.solved_challenges?.length || 0} Solved
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#121722] text-gray-400 border-b border-[#26334a] uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-6 py-3.5">Challenge Title</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Points</th>
                  <th className="px-6 py-3.5">Solved By</th>
                  <th className="px-6 py-3.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#26334a]/80">
                {(!team.solved_challenges || team.solved_challenges.length === 0) ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500 font-mono">
                      No challenges solved yet. Work with your teammates to discover flags!
                    </td>
                  </tr>
                ) : (
                  team.solved_challenges.map((ch, idx) => (
                    <tr key={idx} className="hover:bg-[#1f283a] transition">
                      <td className="px-6 py-3.5 whitespace-nowrap font-bold text-white font-sans text-sm">
                        {ch.title}
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#121722] border border-[#26334a] text-[#F59E0B] font-bold uppercase">
                          {ch.category}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap font-bold text-[#10B981]">
                        +{ch.points} PTS
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <span className={`font-semibold ${ch.solved_by === currentUser?.username ? 'text-[#10B981]' : 'text-gray-300'}`}>
                          {ch.solved_by} {ch.solved_by === currentUser?.username ? '(You)' : ''}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap text-gray-400 text-[11px]">
                        {ch.solved_at}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    );
  }

  // -------------------------------------------------------------
  // ADMINISTRATOR VIEW: Full Tournament Scoreboard (All Teams + All Individuals)
  // -------------------------------------------------------------
  const teamsList = data?.teams || [];
  const individualsList = data?.individuals || [];

  const filteredTeams = teamsList.filter(t => 
    t.team_name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredIndividuals = individualsList.filter(i => 
    i.username.toLowerCase().includes(search.toLowerCase()) || 
    (i.team_name && i.team_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      
      {/* Admin Header Banner */}
      <div className="bg-[#1a2234] border border-[#26334a] rounded-2xl p-6 sm:p-8 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[#F59E0B] font-mono text-xs mb-1 font-bold">
            <Trophy className="w-4 h-4" />
            <span className="uppercase tracking-wider">Tournament Master Scoreboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Administrator Live Leaderboard
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Complete visibility across all competition teams (4 participants each) and individual scoring.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4 text-[#10B981]" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teams or users..."
            className="w-full bg-[#121722] border border-[#26334a] focus:border-[#10B981] rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-white placeholder-gray-500 transition"
          />
        </div>
      </div>

      {/* Admin Tab Switcher */}
      <div className="flex items-center space-x-2 border-b border-[#26334a] pb-3">
        <button
          onClick={() => setAdminTab('teams')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            adminTab === 'teams'
              ? 'bg-[#10B981] text-slate-950 shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-[#1a2234]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Team Rankings (All Teams)</span>
        </button>

        <button
          onClick={() => setAdminTab('individuals')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            adminTab === 'individuals'
              ? 'bg-[#10B981] text-slate-950 shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-[#1a2234]'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Individual Scoring (All Participants)</span>
        </button>
      </div>

      {/* TEAMS RANKING TABLE */}
      {adminTab === 'teams' && (
        <div className="bg-[#1a2234] border border-[#26334a] rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#161c2d] text-gray-400 border-b border-[#26334a] uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-6 py-4">Rank</th>
                  <th className="px-6 py-4">Team Name</th>
                  <th className="px-6 py-4">Participants</th>
                  <th className="px-6 py-4">Solved Flags</th>
                  <th className="px-6 py-4">Total Score</th>
                  <th className="px-6 py-4">Last Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#26334a]/80">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                      Computing team rankings...
                    </td>
                  </tr>
                ) : filteredTeams.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      No teams match your search.
                    </td>
                  </tr>
                ) : (
                  filteredTeams.map((t) => (
                    <tr key={t.team_id} className="hover:bg-[#1f283a] transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRankBadge(t.rank)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-white font-sans">
                          {t.team_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                        <span className="inline-flex items-center space-x-1">
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                          <span>{t.member_count} Members</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                        <span className="inline-flex items-center space-x-1">
                          <CheckCircle className="w-3.5 h-3.5 text-[#10B981]" />
                          <span>{t.challenges_solved}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-[#F59E0B]">
                          {t.total_points} <span className="text-[10px] font-normal text-gray-400">PTS</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-[11px]">
                        {t.last_activity}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INDIVIDUAL SCORING TABLE */}
      {adminTab === 'individuals' && (
        <div className="bg-[#1a2234] border border-[#26334a] rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#161c2d] text-gray-400 border-b border-[#26334a] uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-6 py-4">Rank</th>
                  <th className="px-6 py-4">Participant</th>
                  <th className="px-6 py-4">Team</th>
                  <th className="px-6 py-4">Solved Flags</th>
                  <th className="px-6 py-4">Individual Score</th>
                  <th className="px-6 py-4">Last Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#26334a]/80">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                      Computing participant scores...
                    </td>
                  </tr>
                ) : filteredIndividuals.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      No participants match your search.
                    </td>
                  </tr>
                ) : (
                  filteredIndividuals.map((ind) => (
                    <tr key={ind.user_id} className="hover:bg-[#1f283a] transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRankBadge(ind.rank)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-white font-sans">
                          {ind.username}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#121722] border border-[#26334a] text-gray-300 font-semibold">
                          {ind.team_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                        <span className="inline-flex items-center space-x-1">
                          <CheckCircle className="w-3.5 h-3.5 text-[#10B981]" />
                          <span>{ind.challenges_solved}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-[#F59E0B]">
                          {ind.total_points} <span className="text-[10px] font-normal text-gray-400">PTS</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-[11px]">
                        {ind.last_activity}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
