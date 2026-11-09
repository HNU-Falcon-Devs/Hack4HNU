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

  // ── Load leaderboard & timer data ─────────────────────────────────────────
  useEffect(() => {
    loadData();
    syncTimerFromServer();
  }, []);

  const syncTimerFromServer = async () => {
    try {
      const res = await api.getTimer();
      if (res?.status === 'success' && res.timer) {
        setTimerState(res.timer);
        saveTimerState(res.timer);
        setDisplayMs(computeRemaining(res.timer));
      }
    } catch { }
  };

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

  // ── Timer controls with live backend sync ──────────────────────────────────
  const broadcastTimer = (next) => {
    setTimerState(next);
    saveTimerState(next);
    try {
      window.dispatchEvent(new CustomEvent('hnu_timer_sync', { detail: next }));
    } catch { }
    api.updateTimer(next).catch(() => {});
  };

  const handleStart = () => {
    const rem = computeRemaining(timerState);
    if (rem <= 0) return;
    const next = { ...timerState, running: true, startedAt: Date.now(), remainingMs: rem };
    broadcastTimer(next);
  };

  const handlePause = () => {
    const rem = computeRemaining(timerState);
    const next = { ...timerState, running: false, remainingMs: rem, startedAt: null };
    broadcastTimer(next);
    setDisplayMs(rem);
  };

  const handleReset = () => {
    const next = { running: false, remainingMs: timerState.totalMs, startedAt: null, totalMs: timerState.totalMs };
    broadcastTimer(next);
    setDisplayMs(timerState.totalMs);
  };

  const handleAddTime = (ms) => {
    const rem = computeRemaining(timerState);
    const newRem = rem + ms;
    const next = timerState.running
      ? { ...timerState, remainingMs: newRem, startedAt: Date.now() }
      : { ...timerState, remainingMs: newRem };
    broadcastTimer(next);
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
    broadcastTimer(next);
    setDisplayMs(ms);
    setEditingTime(false);
  };

  const isExpired = displayMs <= 0;
  const isRunning = timerState.running && !isExpired;

  // ── Category color ────────────────────────────────────────────────────────
  const catColor = (cat) => {
    switch ((cat || '').toLowerCase()) {
      case 'web': return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'osint': return 'bg-purple-50 border-purple-200 text-purple-700';
      case 'forensics': return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'network': return 'bg-cyan-50 border-cyan-200 text-cyan-700';
      case 'steganography': return 'bg-pink-50 border-pink-200 text-pink-700';
      default: return 'bg-emerald-50 border-emerald-200 text-[#006633]';
    }
  };

  return (
    <div className="space-y-6">

      {/* ── Competition Timer ─────────────────────────────────────────────── */}
      <div className={`bg-white border rounded-2xl p-6 shadow-sm relative overflow-hidden ${isExpired ? 'border-red-300' : isRunning ? 'border-emerald-300' : 'border-slate-200'}`}>
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#006633]" />
        <div className="absolute top-1 left-0 right-0 h-0.5 bg-[#eab308]" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-1">

          {/* Timer Display */}
          <div className="text-center sm:text-left">
            <div className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-1 flex items-center space-x-2">
              <span>Competition Timer</span>
              {isRunning && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 border border-emerald-300 text-[#006633]">LIVE</span>
              )}
              {isExpired && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 border border-red-300 text-red-600">ENDED</span>
              )}
            </div>
            <div className={`text-5xl font-black font-mono tracking-widest ${isExpired ? 'text-red-600' : isRunning ? 'text-[#006633]' : 'text-slate-900'}`}>
              {formatTime(displayMs)}
            </div>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-xl text-xs font-mono transition-colors"
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
                  className="flex items-center space-x-2 px-5 py-2.5 bg-[#006633] hover:bg-[#004d26] text-white rounded-xl text-sm font-bold transition-colors shadow-sm disabled:opacity-40"
                >
                  <span>Start</span>
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
                >
                  <span>Pause</span>
                </button>
              )}
              <button
                onClick={handleReset}
                className="flex items-center space-x-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-xl text-sm font-bold transition-colors"
              >
                <span>Reset</span>
              </button>
              <button
                onClick={handleOpenEdit}
                className="flex items-center space-x-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-xl text-sm font-bold transition-colors"
              >
                <span>Edit Time</span>
              </button>
            </div>

            {/* Add/Remove Time */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 font-mono">Adjust:</span>
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
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold border transition-colors ${ms > 0
                    ? 'bg-emerald-50 border-emerald-300 text-[#006633] hover:bg-emerald-100'
                    : 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100'
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
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 font-mono">Set Timer</h3>
              <button onClick={() => setEditingTime(false)} className="text-slate-400 hover:text-slate-600">
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
                  {i > 0 && <span className="text-2xl font-black text-slate-400">:</span>}
                  <div className="flex flex-col items-center flex-1">
                    <span className="text-[10px] text-slate-500 font-mono mb-1">{label}</span>
                    <input
                      type="number"
                      min="0"
                      max={max}
                      value={value}
                      onChange={(e) => set(String(parseInt(e.target.value) || 0).padStart(2, '0'))}
                      className="w-full text-center bg-slate-50 border border-slate-300 rounded-xl p-2 text-2xl font-black font-mono text-slate-900 focus:border-[#006633] focus:outline-none"
                    />
                  </div>
                </React.Fragment>
              ))}
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button onClick={() => setEditingTime(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-xl text-xs font-mono transition-colors">Cancel</button>
              <button onClick={handleSaveEdit} className="px-5 py-2 bg-[#006633] hover:bg-[#004d26] text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center space-x-1.5">
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
          <h2 className="text-sm font-bold text-slate-900 font-mono uppercase tracking-wider flex items-center space-x-2">
            <span>Teams &amp; Participants</span>
            <span className="text-slate-500 font-normal normal-case">({leaderboard.length} teams)</span>
          </h2>

          {loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 font-mono text-sm">
              Loading teams...
            </div>
          ) : leaderboard.map((team, ti) => (
            <div key={team.team_id || team.team_name} className="bg-white border border-slate-200 hover:border-[#006633] transition-colors rounded-2xl overflow-hidden shadow-sm">
              {/* Team header */}
              <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-xs font-bold text-[#eab308]">#{ti + 1}</span>
                  <span className="font-bold text-slate-900 text-sm">{team.team_name}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-mono text-slate-500">
                    {(team.members || []).length} / 4 members
                  </span>
                  <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200">
                    <span className="text-sm font-black text-[#006633] font-mono">{team.total_points ?? 0}</span>
                    <span className="text-[10px] text-slate-500 font-mono">pts</span>
                  </div>
                </div>
              </div>

              {/* Members grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-slate-100">
                {(team.members || []).slice(0, 4).map((m, mi) => (
                  <div key={m.username || mi} className="px-4 py-3 space-y-1">
                    <span className="text-xs font-bold text-slate-800 truncate block">{m.username}</span>
                    <div className="text-[11px] font-mono text-[#006633]">{m.points ?? 0} pts</div>
                  </div>
                ))}
                {/* Pad empty slots */}
                {Array.from({ length: Math.max(0, 4 - (team.members || []).length) }).map((_, ei) => (
                  <div key={`empty-${ei}`} className="px-4 py-3 flex items-center justify-center">
                    <span className="text-[11px] text-slate-400 font-mono italic">Empty slot</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Solve Events Feed */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 font-mono uppercase tracking-wider flex items-center space-x-2">
            <span>Solve Events</span>
            <span className="text-slate-500 font-normal normal-case">({solves.length})</span>
          </h2>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            {solves.length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-mono text-sm">
                No solves recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {solves.map((s, i) => (
                  <div key={i} className="px-4 py-3 hover:bg-slate-50 transition-colors space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className="text-xs font-bold text-slate-900 truncate">{s.challenge_title}</span>
                      </div>
                      <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold border font-mono ${catColor(s.category)}`}>
                        {s.category}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pl-5">
                      <div className="text-[11px] font-mono text-slate-500">
                        <span className="text-[#006633] font-bold">{s.username}</span>
                        <span className="text-slate-400 mx-1">·</span>
                        <span>{s.team_name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-bold text-[#eab308] font-mono">+{s.points}pts</span>
                        <span className="text-[10px] text-slate-400 font-mono">{s.solved_at}</span>
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

