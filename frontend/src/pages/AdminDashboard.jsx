import React, { useEffect, useState, useRef } from 'react';

import { api } from '../services/api';

// ─── Competition Timer State (persisted in localStorage) ─────────────────────
const TIMER_KEY = 'hnu_admin_timer';

function loadTimerState() {
  try {
    const raw = localStorage.getItem(TIMER_KEY);
    if (raw) return JSON.parse(raw);
  } catch { }
  return { running: false, remainingMs: 7 * 3600 * 1000, startedAt: null, totalMs: 7 * 3600 * 1000 };
}

function saveTimerState(state) {
  localStorage.setItem(TIMER_KEY, JSON.stringify(state));
}

function computeRemaining(state) {
  if (!state.running || !state.startedAt) return state.remainingMs;
  const elapsed = Date.now() - state.startedAt;
  return Math.max(0, state.remainingMs - elapsed);
}

function formatTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── Demo data for teams/players when API not connected ───────────────────────
const DEMO_TEAMS = [
  {
    team_name: 'Team Alpha',
    team_id: 1,
    total_points: 850,
    members: [
      { username: 'cyberspartan', points: 300 },
      { username: 'alpha_hunter', points: 250 },
      { username: 'alpha_sentry', points: 200 },
      { username: 'alpha_vanguard', points: 100 },
    ]
  },
  {
    team_name: 'Team Bravo',
    team_id: 2,
    total_points: 650,
    members: [
      { username: 'bravo_falcon', points: 300 },
      { username: 'bravo_shadow', points: 200 },
      { username: 'bravo_cipher', points: 100 },
      { username: 'bravo_specter', points: 50 },
    ]
  },
  {
    team_name: 'Team Gamma',
    team_id: 3,
    total_points: 400,
    members: [
      { username: 'gamma_one', points: 200 },
      { username: 'gamma_two', points: 100 },
      { username: 'gamma_three', points: 100 },
      { username: 'gamma_four', points: 0 },
    ]
  }
];

const DEMO_SOLVES = [
  { username: 'cyberspartan', team_name: 'Team Alpha', challenge_title: 'SQL Injection Basics', category: 'Web', points: 100, solved_at: '14:03:21' },
  { username: 'bravo_falcon', team_name: 'Team Bravo', challenge_title: 'OSINT Recon 101', category: 'OSINT', points: 150, solved_at: '14:11:08' },
  { username: 'alpha_hunter', team_name: 'Team Alpha', challenge_title: 'Hidden in Plain Sight', category: 'Steganography', points: 200, solved_at: '14:22:44' },
  { username: 'bravo_shadow', team_name: 'Team Bravo', challenge_title: 'Network Sniff', category: 'Network', points: 100, solved_at: '14:35:19' },
  { username: 'gamma_one', team_name: 'Team Gamma', challenge_title: 'SQL Injection Basics', category: 'Web', points: 100, solved_at: '14:51:02' },
];

export default function AdminDashboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [solves, setSolves] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Timer state ──────────────────────────────────────────────────────────
  const [timerState, setTimerState] = useState(loadTimerState);
  const [displayMs, setDisplayMs] = useState(() => computeRemaining(loadTimerState()));
  const [editingTime, setEditingTime] = useState(false);
  const [editH, setEditH] = useState('07');
  const [editM, setEditM] = useState('00');
  const [editS, setEditS] = useState('00');
  const tickRef = useRef(null);

  // ── Tick ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const tick = () => {
      setTimerState(prev => {
        const rem = computeRemaining(prev);
        setDisplayMs(rem);
        if (rem <= 0 && prev.running) {
          const next = { ...prev, running: false, remainingMs: 0, startedAt: null };
          saveTimerState(next);
          return next;
        }
        return prev;
      });
    };
    tickRef.current = setInterval(tick, 500);
    return () => clearInterval(tickRef.current);
  }, []);

  // ── Load leaderboard data ─────────────────────────────────────────────────
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [lbRes] = await Promise.all([api.getLeaderboard()]);
      if (lbRes?.status === 'success' && lbRes.teams?.length > 0) {
        setLeaderboard(lbRes.teams || []);
        setSolves(lbRes.recent_solves || []);
      } else {
        setLeaderboard(DEMO_TEAMS);
        setSolves(DEMO_SOLVES);
      }
    } catch {
      setLeaderboard(DEMO_TEAMS);
      setSolves(DEMO_SOLVES);
    }
    setLoading(false);
  };

  // ── Timer controls ────────────────────────────────────────────────────────
  const handleStart = () => {
    const rem = computeRemaining(timerState);
    if (rem <= 0) return;
    const next = { ...timerState, running: true, startedAt: Date.now(), remainingMs: rem };
    setTimerState(next);
    saveTimerState(next);
  };

  const handlePause = () => {
    const rem = computeRemaining(timerState);
    const next = { ...timerState, running: false, remainingMs: rem, startedAt: null };
    setTimerState(next);
    saveTimerState(next);
    setDisplayMs(rem);
  };

  const handleReset = () => {
    const next = { running: false, remainingMs: timerState.totalMs, startedAt: null, totalMs: timerState.totalMs };
    setTimerState(next);
    saveTimerState(next);
    setDisplayMs(timerState.totalMs);
  };

  const handleAddTime = (ms) => {
    const rem = computeRemaining(timerState);
    const newRem = rem + ms;
    const next = timerState.running
      ? { ...timerState, remainingMs: newRem, startedAt: Date.now() }
      : { ...timerState, remainingMs: newRem };
    setTimerState(next);
    saveTimerState(next);
    setDisplayMs(newRem);
  };

  const handleOpenEdit = () => {
    const rem = computeRemaining(timerState);
    const totalSec = Math.floor(rem / 1000);
    setEditH(String(Math.floor(totalSec / 3600)).padStart(2, '0'));
    setEditM(String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0'));
    setEditS(String(totalSec % 60).padStart(2, '0'));
    setEditingTime(true);
  };

  const handleSaveEdit = () => {
    const ms = (parseInt(editH || 0) * 3600 + parseInt(editM || 0) * 60 + parseInt(editS || 0)) * 1000;
    if (ms <= 0) return;
    const next = timerState.running
      ? { ...timerState, remainingMs: ms, startedAt: Date.now() }
      : { ...timerState, remainingMs: ms };
    setTimerState(next);
    saveTimerState(next);
    setDisplayMs(ms);
    setEditingTime(false);
  };

  const isExpired = displayMs <= 0;
  const isRunning = timerState.running && !isExpired;

  // ── Category color ────────────────────────────────────────────────────────
  const catColor = (cat) => {
    switch ((cat || '').toLowerCase()) {
      case 'web': return 'bg-blue-950/80 border-blue-700/60 text-blue-300';
      case 'osint': return 'bg-purple-950/80 border-purple-700/60 text-purple-300';
      case 'forensics': return 'bg-amber-950/80 border-amber-700/60 text-amber-300';
      case 'network': return 'bg-cyan-950/80 border-cyan-700/60 text-cyan-300';
      case 'steganography': return 'bg-pink-950/80 border-pink-700/60 text-pink-300';
      default: return 'bg-emerald-950/80 border-emerald-700/60 text-emerald-300';
    }
  };

  return (
    <div className="space-y-6">



      {/* ── Competition Timer ─────────────────────────────────────────────── */}
      <div className={`bg-[#1a2234] border rounded-2xl p-6 shadow-lg ${isExpired ? 'border-red-700/60' : isRunning ? 'border-emerald-600/60' : 'border-[#26334a]'}`}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">



          {/* Timer Display */}
          <div className="text-center sm:text-left">
            <div className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-1 flex items-center space-x-2">
              <span>Competition Timer</span>
              {isRunning && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 border border-emerald-700 text-emerald-400 animate-pulse">LIVE</span>
              )}
              {isExpired && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-950 border border-red-700 text-red-400">ENDED</span>
              )}
            </div>
            <div className={`text-5xl font-black font-mono tracking-widest ${isExpired ? 'text-red-400' : isRunning ? 'text-emerald-400' : 'text-white'}`}>
              {formatTime(displayMs)}
            </div>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="px-3.5 py-2 bg-[#121722] hover:bg-[#202b3d] border border-[#26334a] text-gray-300 rounded-xl text-xs font-mono transition"
          >
            <span>Refresh</span>
          </button>

          {/* Timer Controls */}
          <div className="flex flex-col gap-3 w-full sm:w-auto">
            {/* Primary controls */}
            <div className="flex items-center gap-2">
              {!isRunning ? (
                <button
                  onClick={handleStart}
                  disabled={isExpired}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-[#059669] to-[#10B981] hover:from-[#047857] hover:to-[#059669] text-white rounded-xl text-sm font-bold transition shadow-lg shadow-emerald-900/30 disabled:opacity-40"
                >
                  <span>Start</span>
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-bold transition shadow-lg"
                >
                  <span>Pause</span>
                </button>
              )}
              <button
                onClick={handleReset}
                className="flex items-center space-x-2 px-4 py-2.5 bg-[#121722] hover:bg-[#202b3d] border border-[#26334a] text-gray-300 rounded-xl text-sm font-bold transition"
              >
                <span>Reset</span>
              </button>
              <button
                onClick={handleOpenEdit}
                className="flex items-center space-x-2 px-4 py-2.5 bg-[#121722] hover:bg-[#202b3d] border border-[#26334a] text-gray-300 rounded-xl text-sm font-bold transition"
              >
                <span>Edit Time</span>
              </button>
            </div>

            {/* Add/Remove Time */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500 font-mono">Adjust:</span>
              {[
                { label: '+5m', ms: 5 * 60 * 1000 },
                { label: '+15m', ms: 15 * 60 * 1000 },
                { label: '+30m', ms: 30 * 60 * 1000 },
                { label: '-5m', ms: -5 * 60 * 1000 },
                { label: '-15m', ms: -15 * 60 * 1000 },
              ].map(({ label, ms }) => (
                <button
                  key={label}
                  onClick={() => handleAddTime(ms)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold border transition ${ms > 0
                    ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300 hover:bg-emerald-950/80'
                    : 'bg-red-950/40 border-red-700/50 text-red-300 hover:bg-red-950/80'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Edit Time Modal ───────────────────────────────────────────────── */}
      {editingTime && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1a2234] border border-[#26334a] rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white font-mono">Set Timer</h3>
              <button onClick={() => setEditingTime(false)} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>
            <div className="flex items-center space-x-3">
              {[
                { label: 'HH', value: editH, set: setEditH, max: 23 },
                { label: 'MM', value: editM, set: setEditM, max: 59 },
                { label: 'SS', value: editS, set: setEditS, max: 59 },
              ].map(({ label, value, set, max }, i) => (
                <React.Fragment key={label}>
                  {i > 0 && <span className="text-2xl font-black text-gray-500">:</span>}
                  <div className="flex flex-col items-center flex-1">
                    <span className="text-[10px] text-gray-500 font-mono mb-1">{label}</span>
                    <input
                      type="number"
                      min="0"
                      max={max}
                      value={value}
                      onChange={(e) => set(String(parseInt(e.target.value) || 0).padStart(2, '0'))}
                      className="w-full text-center bg-[#121722] border border-[#26334a] rounded-xl p-2 text-2xl font-black font-mono text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </React.Fragment>
              ))}
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button onClick={() => setEditingTime(false)} className="px-4 py-2 bg-[#121722] hover:bg-[#202b3d] border border-[#26334a] text-gray-300 rounded-xl text-xs font-mono transition">Cancel</button>
              <button onClick={handleSaveEdit} className="px-5 py-2 bg-gradient-to-r from-[#059669] to-[#10B981] hover:from-[#047857] hover:to-[#059669] text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5">
                <span>Apply</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Grid: Teams + Solve Feed ────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Teams & Players */}
        <div className="xl:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center space-x-2">
            <span>Teams &amp; Participants</span>
            <span className="text-gray-500 font-normal normal-case">({leaderboard.length} teams)</span>
          </h2>

          {loading ? (
            <div className="bg-[#1a2234] border border-[#26334a] rounded-2xl p-12 text-center text-gray-400 font-mono text-sm">
              Loading teams...
            </div>
          ) : leaderboard.map((team, ti) => (
            <div key={team.team_id || team.team_name} className="bg-[#1a2234] border border-[#26334a] rounded-2xl overflow-hidden shadow-md">
              {/* Team header */}
              <div className="flex items-center justify-between px-5 py-3.5 bg-[#161c2d] border-b border-[#26334a]">
                <div className="flex items-center space-x-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs text-white shadow ${ti === 0 ? 'bg-gradient-to-tr from-amber-500 to-yellow-400' :
                    ti === 1 ? 'bg-gradient-to-tr from-gray-400 to-gray-300' :
                      ti === 2 ? 'bg-gradient-to-tr from-orange-700 to-orange-500' :
                        'bg-gradient-to-tr from-[#059669] to-[#10B981]'
                    }`}>
                    {ti + 1}
                  </div>
                  <span className="font-bold text-white text-sm">{team.team_name}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-mono text-gray-400">
                    {(team.members || []).length} / 4 members
                  </span>
                  <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-700/50">
                    <span className="text-sm font-black text-white font-mono">{team.total_points ?? 0}</span>
                    <span className="text-[10px] text-gray-400 font-mono">pts</span>
                  </div>
                </div>
              </div>

              {/* Members grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-[#26334a]">
                {(team.members || []).slice(0, 4).map((m, mi) => (
                  <div key={m.username || mi} className="px-4 py-3 space-y-1">
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#059669] to-[#10B981] flex items-center justify-center text-[9px] font-bold text-white">
                        {(m.username || '?').charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-white truncate">{m.username}</span>
                    </div>
                    <div className="text-[11px] font-mono text-emerald-400 pl-7">{m.points ?? 0} pts</div>
                  </div>
                ))}
                {/* Pad empty slots */}
                {Array.from({ length: Math.max(0, 4 - (team.members || []).length) }).map((_, ei) => (
                  <div key={`empty-${ei}`} className="px-4 py-3 flex items-center justify-center">
                    <span className="text-[11px] text-gray-600 font-mono italic">Empty slot</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Solve Events Feed */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center space-x-2">
            <span>Solve Events</span>
            <span className="text-gray-500 font-normal normal-case">({solves.length})</span>
          </h2>

          <div className="bg-[#1a2234] border border-[#26334a] rounded-2xl overflow-hidden shadow-md">
            {solves.length === 0 ? (
              <div className="p-8 text-center text-gray-500 font-mono text-sm">
                No solves recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-[#26334a] max-h-[600px] overflow-y-auto">
                {solves.map((s, i) => (
                  <div key={i} className="px-4 py-3 hover:bg-[#202b3d] transition space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className="text-xs font-bold text-white truncate">{s.challenge_title}</span>
                      </div>
                      <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold border font-mono ${catColor(s.category)}`}>
                        {s.category}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pl-5">
                      <div className="text-[11px] font-mono text-gray-400">
                        <span className="text-emerald-300 font-bold">{s.username}</span>
                        <span className="text-gray-600 mx-1">·</span>
                        <span>{s.team_name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-bold text-[#F59E0B] font-mono">+{s.points}pts</span>
                        <span className="text-[10px] text-gray-500 font-mono">{s.solved_at}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

