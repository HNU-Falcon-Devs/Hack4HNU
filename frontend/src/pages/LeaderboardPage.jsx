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
        <div className="flex items-center space-x-1 text-[#eab308] font-black font-mono">
          <span>#1</span>
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="flex items-center space-x-1 text-slate-600 font-bold font-mono">
          <span>#2</span>
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="flex items-center space-x-1 text-amber-700 font-bold font-mono">
          <span>#3</span>
        </div>
      );
    }
    return <span className="font-mono text-slate-500 font-medium">#{rank}</span>;
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
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#006633]" />
          <div className="absolute top-1 left-0 right-0 h-0.5 bg-[#eab308]" />

          <div className="pt-1">
            <div className="flex items-center space-x-2 text-[#006633] font-mono text-xs mb-1 font-bold">
              <span className="uppercase tracking-wider">HNU CTF • Team Standings</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {team.team_name} Scoreboard
            </h1>
          </div>

          <div className="bg-slate-50 border border-slate-200 px-5 py-3 rounded-xl flex items-center space-x-6">
            <div>
              <div className="text-[10px] uppercase font-mono text-slate-500 font-bold">Team Total</div>
              <div className="text-2xl font-black font-mono text-[#eab308]">
                {team.total_points} <span className="text-xs text-slate-500">PTS</span>
              </div>
            </div>
            <div className="border-l border-slate-200 pl-5">
              <div className="text-[10px] uppercase font-mono text-slate-500 font-bold">Solved</div>
              <div className="text-2xl font-black font-mono text-[#006633]">
                {team.challenges_solved} <span className="text-xs text-slate-500">Flags</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Team Participants Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Team Participants (4 Members)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {team.members.map((member, idx) => {
              const isMe = member.username === currentUser?.username;
              return (
                <div
                  key={idx}
                  className={`bg-white border rounded-2xl p-5 shadow-sm flex flex-col justify-between transition-colors ${isMe
                    ? 'border-[#006633] bg-emerald-50/20'
                    : 'border-slate-200 hover:border-[#006633]'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#eab308]">
                      Member {idx + 1}
                    </span>
                    {isMe && (
                      <span className="text-[10px] font-mono font-bold bg-[#006633] text-white px-2 py-0.5 rounded-full">
                        YOU
                      </span>
                    )}
                  </div>

                  <div className="my-3">
                    <h3 className={`text-base font-bold truncate ${isMe ? 'text-[#006633]' : 'text-slate-900'}`}>
                      {member.username}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {member.solves} challenges solved
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono text-slate-500">Contribution</span>
                    <span className="text-base font-mono font-bold text-slate-900">
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
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm space-y-0">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Challenges Solved by {team.team_name}
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-500">
              {team.solved_challenges?.length || 0} Solved
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-6 py-3.5">Challenge Title</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Points</th>
                  <th className="px-6 py-3.5">Solved By</th>
                  <th className="px-6 py-3.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(!team.solved_challenges || team.solved_challenges.length === 0) ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500 font-mono">
                      No challenges solved yet. Work with your teammates to discover flags!
                    </td>
                  </tr>
                ) : (
                  team.solved_challenges.map((ch, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3.5 whitespace-nowrap font-bold text-slate-900 font-sans text-sm">
                        {ch.title}
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold uppercase">
                          {ch.category}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap font-bold text-[#006633]">
                        +{ch.points} PTS
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <span className={`font-semibold ${ch.solved_by === currentUser?.username ? 'text-[#006633]' : 'text-slate-700'}`}>
                          {ch.solved_by} {ch.solved_by === currentUser?.username ? '(You)' : ''}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap text-slate-500 text-[11px]">
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

      {/* Admin Tab Switcher & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setAdminTab('teams')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${adminTab === 'teams'
              ? 'bg-[#006633] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
          >
            <span>Team Rankings (All Teams)</span>
          </button>

          <button
            onClick={() => setAdminTab('individuals')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${adminTab === 'individuals'
              ? 'bg-[#006633] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
          >
            <span>Individual Scoring (All Participants)</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teams or users..."
            className="w-full bg-white border border-slate-300 focus:border-[#006633] rounded-xl px-4 py-2 text-xs font-mono text-slate-900 placeholder-slate-400 transition-colors focus:outline-none"
          />
        </div>
      </div>

      {/* TEAMS RANKING TABLE */}
      {adminTab === 'teams' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-6 py-4">Rank</th>
                  <th className="px-6 py-4">Team Name</th>
                  <th className="px-6 py-4">Solved Flags</th>
                  <th className="px-6 py-4">Total Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                      Computing team rankings...
                    </td>
                  </tr>
                ) : filteredTeams.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                      No teams match your search.
                    </td>
                  </tr>
                ) : (
                  filteredTeams.map((t) => (
                    <tr key={t.team_id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRankBadge(t.rank)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-slate-900 font-sans">
                          {t.team_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                        <span>{t.challenges_solved}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-[#eab308]">
                          {t.total_points} <span className="text-[10px] font-normal text-slate-500">PTS</span>
                        </span>
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
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-6 py-4">Rank</th>
                  <th className="px-6 py-4">Participant</th>
                  <th className="px-6 py-4">Team</th>
                  <th className="px-6 py-4">Solved Flags</th>
                  <th className="px-6 py-4">Individual Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                      Computing participant scores...
                    </td>
                  </tr>
                ) : filteredIndividuals.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                      No participants match your search.
                    </td>
                  </tr>
                ) : (
                  filteredIndividuals.map((ind) => (
                    <tr key={ind.user_id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRankBadge(ind.rank)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-slate-900 font-sans">
                          {ind.username}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-slate-700 font-medium">
                          {ind.team_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                        <span>{ind.challenges_solved}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-[#eab308]">
                          {ind.total_points} <span className="text-[10px] font-normal text-slate-500">PTS</span>
                        </span>
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
