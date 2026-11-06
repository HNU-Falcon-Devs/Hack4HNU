import React, { useEffect, useState } from 'react';
import { Trophy, Medal, Award, Search, User, Clock, CheckCircle } from 'lucide-react';
import { api } from '../services/api';

export default function LeaderboardPage({ currentUser }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    const res = await api.getLeaderboard();
    if (res.status === 'success' && res.leaderboard) {
      setLeaderboard(res.leaderboard);
    }
    setLoading(false);
  };

  const filtered = leaderboard.filter(item => 
    item.username.toLowerCase().includes(search.toLowerCase())
  );

  const topThree = leaderboard.slice(0, 3);

  const getRankBadge = (rank) => {
    if (rank === 1) {
      return (
        <div className="flex items-center space-x-1 text-amber-400 font-bold font-mono">
          <Trophy className="w-4 h-4 text-amber-400" />
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

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 font-mono text-xs mb-1">
            <Trophy className="w-4 h-4" />
            <span className="uppercase tracking-wider font-bold">Official CTF Scoreboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Hall of Fame & Leaderboard
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Real-time rankings based on verified flag submissions. Solved early breaks score ties.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
            <Search className="w-4 h-4 text-cyan-400" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search competitor..."
            className="w-full bg-[#080D18] border border-gray-700 focus:border-[#00D4FF] rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-white placeholder-gray-500"
          />
        </div>
      </div>

      {/* Podium Highlight (Top 3) */}
      {!loading && topThree.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* #2 Silver */}
          {topThree[1] && (
            <div className="order-2 md:order-1 bg-gradient-to-b from-[#162032] to-[#111827] border border-slate-700/60 rounded-xl p-5 text-center relative shadow-lg">
              <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-slate-400 text-slate-300 mx-auto flex items-center justify-center font-bold text-lg font-mono mb-2 shadow">
                2
              </div>
              <h3 className="text-base font-bold text-white truncate">{topThree[1].username}</h3>
              <div className="text-2xl font-bold font-mono text-slate-300 mt-1">{topThree[1].total_points} <span className="text-xs text-gray-400">PTS</span></div>
              <p className="text-xs text-gray-400 font-mono mt-1">{topThree[1].challenges_solved} challenges solved</p>
            </div>
          )}

          {/* #1 Gold */}
          {topThree[0] && (
            <div className="order-1 md:order-2 bg-gradient-to-b from-[#232115] to-[#111827] border border-amber-500/60 rounded-xl p-6 text-center relative shadow-xl transform md:-translate-y-2">
              <div className="w-14 h-14 rounded-full bg-amber-950 border-2 border-amber-400 text-amber-300 mx-auto flex items-center justify-center font-bold text-xl font-mono mb-2 shadow-lg shadow-amber-500/20">
                <Trophy className="w-7 h-7 text-amber-400" />
              </div>
              <div className="text-[10px] uppercase font-mono font-bold text-amber-400 tracking-widest">Champion</div>
              <h3 className="text-lg font-extrabold text-white truncate mt-0.5">{topThree[0].username}</h3>
              <div className="text-3xl font-extrabold font-mono text-[#00D4FF] mt-1">{topThree[0].total_points} <span className="text-xs text-gray-400">PTS</span></div>
              <p className="text-xs text-gray-300 font-mono mt-1">{topThree[0].challenges_solved} challenges solved</p>
            </div>
          )}

          {/* #3 Bronze */}
          {topThree[2] && (
            <div className="order-3 md:order-3 bg-gradient-to-b from-[#221a15] to-[#111827] border border-amber-800/60 rounded-xl p-5 text-center relative shadow-lg">
              <div className="w-12 h-12 rounded-full bg-amber-950/80 border-2 border-amber-700 text-amber-500 mx-auto flex items-center justify-center font-bold text-lg font-mono mb-2 shadow">
                3
              </div>
              <h3 className="text-base font-bold text-white truncate">{topThree[2].username}</h3>
              <div className="text-2xl font-bold font-mono text-amber-500 mt-1">{topThree[2].total_points} <span className="text-xs text-gray-400">PTS</span></div>
              <p className="text-xs text-gray-400 font-mono mt-1">{topThree[2].challenges_solved} challenges solved</p>
            </div>
          )}

        </div>
      )}

      {/* Main Leaderboard Table */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0B1120] text-gray-400 border-b border-gray-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-6 py-4">Rank</th>
                <th className="px-6 py-4">Competitor</th>
                <th className="px-6 py-4">Solved</th>
                <th className="px-6 py-4">Total Score</th>
                <th className="px-6 py-4">Last Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/80">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                    Computing leaderboard standings...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    No participants matched your search.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isCurrent = currentUser?.username === item.username;
                  return (
                    <tr 
                      key={item.user_id}
                      className={`transition ${isCurrent ? 'bg-cyan-950/30 font-bold border-l-2 border-[#00D4FF]' : 'hover:bg-gray-800/40'}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRankBadge(item.rank)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm ${isCurrent ? 'text-cyan-300 font-bold' : 'text-white'}`}>
                            {item.username}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-800 text-cyan-400">
                              YOU
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                        <span className="inline-flex items-center space-x-1">
                          <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                          <span>{item.challenges_solved}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-[#00D4FF]">
                          {item.total_points} <span className="text-[10px] font-normal text-gray-400">PTS</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-[11px]">
                        {item.last_activity}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

