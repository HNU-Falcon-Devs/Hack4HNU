import React, { useEffect, useState } from 'react';
import {
  ShieldAlert, Activity, Server, FileText, RefreshCw, Search, Plus,
  Eye, Ban, CheckCircle2, AlertCircle, Sliders, BarChart3,
  PieChart as PieIcon, Clock, Flag, Users, Shield, Flame, Filter,
  ChevronLeft, ChevronRight, AlertTriangle, ShieldCheck
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { api } from '../services/api';
import InvestigateIpModal from '../components/InvestigateIpModal';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'attacks', label: 'Attacks' },
  { id: 'ip', label: 'IP Filter' },
  { id: 'logs', label: 'Security Logs' },
];

const EVENT_TYPES = [
  'ALL', 'FLAG_ATTEMPT_FAILED', 'FLAG_ATTEMPT_SUCCESS',
  'BRUTE_FORCE_SUSPICIOUS', 'BRUTE_FORCE_HIGH_RISK', 'BRUTE_FORCE_CRITICAL',
  'RATE_LIMITED', 'IP_BLOCKED_ACCESS', 'AUTH_FAILED', 'AUTH_SUCCESS', 'ADMIN_ACTION'
];
const THREAT_LEVELS = ['ALL', 'Low', 'Medium', 'High', 'Critical'];
const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6'];

export default function SystemMonitorPage() {
  const [activeTab, setActiveTab] = useState('overview');

  // Overview
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);

  // Attacks
  const [attacks, setAttacks] = useState([]);
  const [thresholds, setThresholds] = useState({
    threshold_1min_suspicious: 5, threshold_5min_highrisk: 10,
    threshold_10min_critical: 20, enforce_ip_blocking: 1
  });
  const [attacksLoading, setAttacksLoading] = useState(false);
  const [savingThresholds, setSavingThresholds] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [attackSearch, setAttackSearch] = useState('');
  const [investigatingIp, setInvestigatingIp] = useState(null);

  // IP Filter
  const [ips, setIps] = useState([]);
  const [ipHistory, setIpHistory] = useState([]);
  const [ipFilter, setIpFilter] = useState('all');
  const [ipLoading, setIpLoading] = useState(false);
  const [ipSearch, setIpSearch] = useState('');
  const [showAddIpModal, setShowAddIpModal] = useState(false);
  const [newIp, setNewIp] = useState('');
  const [newAction, setNewAction] = useState('block');
  const [newNotes, setNewNotes] = useState('');
  const [newEnforced, setNewEnforced] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Logs
  const [logs, setLogs] = useState([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsTotalPages, setLogsTotalPages] = useState(1);
  const [logsPage, setLogsPage] = useState(1);
  const [logsLimit] = useState(20);
  const [logsSearch, setLogsSearch] = useState('');
  const [logsEventType, setLogsEventType] = useState('ALL');
  const [logsThreatLevel, setLogsThreatLevel] = useState('ALL');
  const [logsLoading, setLogsLoading] = useState(false);

  // ── Load on tab change ───────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'overview') loadOverview();
    else if (activeTab === 'attacks') loadAttacks();
    else if (activeTab === 'ip') loadIps();
    else if (activeTab === 'logs') loadLogs();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'ip') loadIps();
  }, [ipFilter]);

  useEffect(() => {
    if (activeTab === 'logs') loadLogs();
  }, [logsPage, logsEventType, logsThreatLevel]);

  // ── Overview ─────────────────────────────────────────────────────────────
  const loadOverview = async () => {
    setOverviewLoading(true);
    const [statsRes, chartsRes] = await Promise.all([api.getSocStats(), api.getSocCharts()]);
    if (statsRes.status === 'success') setStats(statsRes.stats);
    if (chartsRes.status === 'success') setCharts(chartsRes.charts);
    setOverviewLoading(false);
  };

  // ── Attacks ───────────────────────────────────────────────────────────────
  const loadAttacks = async () => {
    setAttacksLoading(true);
    const [atkRes, thrRes] = await Promise.all([api.getSocAttacks(), api.getSocThresholds()]);
    if (atkRes.status === 'success' && atkRes.attacks) setAttacks(atkRes.attacks);
    if (thrRes.status === 'success' && thrRes.thresholds) setThresholds(thrRes.thresholds);
    setAttacksLoading(false);
  };

  const handleSaveThresholds = async (e) => {
    e.preventDefault();
    setSavingThresholds(true); setSaveMessage(null);
    const res = await api.updateSocThresholds(thresholds);
    setSavingThresholds(false);
    if (res.status === 'success') {
      setSaveMessage({ type: 'success', text: 'Thresholds updated and deployed.' });
      loadAttacks();
    } else {
      setSaveMessage({ type: 'error', text: res.message || 'Failed to update thresholds' });
    }
  };

  const filteredAttacks = attacks.filter(a =>
    (a.participant || '').toLowerCase().includes(attackSearch.toLowerCase()) ||
    (a.ip_address || '').toLowerCase().includes(attackSearch.toLowerCase()) ||
    (a.challenge || '').toLowerCase().includes(attackSearch.toLowerCase())
  );

  // ── IP Filter ─────────────────────────────────────────────────────────────
  const loadIps = async () => {
    setIpLoading(true);
    const [ipsRes, histRes] = await Promise.all([api.getIps(ipFilter), api.getIpActionsHistory()]);
    if (ipsRes.status === 'success' && ipsRes.ips) setIps(ipsRes.ips);
    if (histRes.status === 'success' && histRes.history) setIpHistory(histRes.history);
    setIpLoading(false);
  };

  const handleManualIpAction = async (e) => {
    e.preventDefault();
    if (!newIp.trim()) return;
    setActionLoading(true);
    const res = await api.manageIp(newAction, { ip_address: newIp.trim(), notes: newNotes.trim(), is_enforced: newEnforced ? 1 : 0 });
    setActionLoading(false);
    if (res.status === 'success') { setNewIp(''); setNewNotes(''); setShowAddIpModal(false); loadIps(); }
    else alert(res.message || 'Operation failed');
  };

  const handleQuickIpAction = async (ip, action) => {
    const res = await api.manageIp(action, { ip_address: ip, notes: `Quick ${action}`, is_enforced: 1 });
    if (res.status === 'success') loadIps();
  };

  const filteredIps = ips.filter(ip =>
    ip.ip_address.toLowerCase().includes(ipSearch.toLowerCase()) ||
    (ip.reason && ip.reason.toLowerCase().includes(ipSearch.toLowerCase()))
  );

  // ── Logs ──────────────────────────────────────────────────────────────────
  const loadLogs = async () => {
    setLogsLoading(true);
    const params = { page: logsPage, limit: logsLimit, search: logsSearch };
    if (logsEventType !== 'ALL') params.event_type = logsEventType;
    if (logsThreatLevel !== 'ALL') params.threat_level = logsThreatLevel;
    const res = await api.getSecurityLogs(params);
    if (res.status === 'success') {
      setLogs(res.logs || []);
      setLogsTotal(res.total || 0);
      setLogsTotalPages(res.total_pages || 1);
    }
    setLogsLoading(false);
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getThreatBadge = (level) => {
    switch (level) {
      case 'Critical': return 'bg-red-950/90 text-red-400 border-red-700 font-bold';
      case 'High': return 'bg-orange-950/90 text-orange-400 border-orange-700 font-bold';
      case 'Medium': return 'bg-amber-950/90 text-amber-400 border-amber-700';
      default: return 'bg-[#121722] text-gray-300 border-[#26334a]';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'blocked': return 'bg-red-950 text-red-400 border-red-800 font-bold';
      case 'rate_limited': return 'bg-amber-950 text-amber-400 border-amber-800 font-bold';
      case 'suspicious': return 'bg-orange-950 text-orange-400 border-orange-800 font-bold';
      case 'whitelisted': return 'bg-emerald-950 text-emerald-400 border-emerald-800 font-bold';
      default: return 'bg-[#121722] text-gray-300 border-[#26334a]';
    }
  };

  const getLogEventColor = (et) => {
    if (!et) return 'text-gray-400';
    if (et.includes('SUCCESS')) return 'text-emerald-400';
    if (et.includes('FAILED') || et.includes('HIGH_RISK') || et.includes('CRITICAL') || et.includes('BLOCKED')) return 'text-red-400';
    if (et.includes('SUSPICIOUS') || et.includes('RATE_LIMITED')) return 'text-amber-400';
    if (et.includes('AUTH')) return 'text-blue-400';
    if (et.includes('ADMIN')) return 'text-purple-400';
    return 'text-gray-300';
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-[#1a2234] border border-[#26334a] rounded-2xl p-6 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight font-mono">System Monitor</h1>

        </div>
        <button
          onClick={() => { if (activeTab === 'overview') loadOverview(); else if (activeTab === 'attacks') loadAttacks(); else if (activeTab === 'ip') loadIps(); else loadLogs(); }}
          className="px-3.5 py-2 bg-[#121722] hover:bg-[#202b3d] border border-[#26334a] text-gray-300 rounded-xl text-xs font-mono flex items-center space-x-1.5 transition"
        >
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-1 bg-[#161c2d] border border-[#26334a] rounded-xl p-1">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition flex-1 justify-center ${activeTab === id
                ? 'bg-[#1a2234] border border-[#26334a] text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
              }`}
          >
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ═══ OVERVIEW TAB ══════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 font-mono">
            {[
              { label: 'Competitors', value: stats?.total_participants ?? 0, color: 'text-white' },
              { label: 'Active (24h)', value: stats?.active_participants ?? 0, color: 'text-emerald-400' },
              { label: 'Total Guesses', value: stats?.total_submissions ?? 0, color: 'text-white' },
              { label: 'Correct Flags', value: stats?.correct_submissions ?? 0, color: 'text-emerald-400' },
              { label: 'Incorrect', value: stats?.incorrect_submissions ?? 0, color: 'text-red-400' },
              { label: 'Flagged IPs', value: stats?.suspicious_ips ?? 0, color: 'text-amber-400' },
              { label: 'Brute Detected', value: stats?.detected_brute_force ?? 0, color: 'text-red-500' },
              { label: 'Active Alerts', value: stats?.active_suspicious_activity ?? 0, color: 'text-red-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-[#1a2234] border border-[#26334a] rounded-xl p-3 shadow-md">
                <div className="text-[10px] uppercase text-gray-400 truncate">{label}</div>
                <div className={`text-xl font-bold mt-1 ${color}`}>{value}</div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie */}
            <div className="bg-[#1a2234] border border-[#26334a] rounded-2xl p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#26334a]">
                <h2 className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center space-x-2">
                  <span>Flag Accuracy</span>
                </h2>
                <span className="text-[11px] text-gray-500 font-mono">Cumulative</span>
              </div>
              <div className="h-64">
                {charts?.success_vs_failed ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={charts.success_vs_failed} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value">
                        {charts.success_vs_failed.map((e, i) => <Cell key={i} fill={e.fill || COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#121722', borderColor: '#26334a', borderRadius: '12px', fontSize: '12px', fontFamily: 'monospace' }} />
                      <Legend wrapperStyle={{ fontSize: '12px', fontFamily: 'monospace' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center text-xs text-gray-500 font-mono">No data</div>}
              </div>
            </div>

            {/* Area */}
            <div className="bg-[#1a2234] border border-[#26334a] rounded-2xl p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#26334a]">
                <h2 className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center space-x-2">
                  <span>Submission Volume</span>
                </h2>
                <span className="text-[11px] text-gray-500 font-mono">Hourly</span>
              </div>
              <div className="h-64">
                {charts?.submissions_over_time ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={charts.submissions_over_time}>
                      <defs>
                        <linearGradient id="cTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="cFailed" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="hour_label" stroke="#475569" fontSize={11} fontFamily="monospace" />
                      <YAxis stroke="#475569" fontSize={11} fontFamily="monospace" />
                      <Tooltip contentStyle={{ backgroundColor: '#121722', borderColor: '#26334a', borderRadius: '12px', fontSize: '12px', fontFamily: 'monospace' }} />
                      <Area type="monotone" dataKey="total" name="Total" stroke="#10B981" fillOpacity={1} fill="url(#cTotal)" />
                      <Area type="monotone" dataKey="incorrect" name="Incorrect" stroke="#EF4444" fillOpacity={1} fill="url(#cFailed)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center text-xs text-gray-500 font-mono">No data</div>}
              </div>
            </div>

            {/* Top Suspicious IPs */}
            <div className="bg-[#1a2234] border border-[#26334a] rounded-2xl p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#26334a]">
                <h2 className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center space-x-2">
                  <span>Top Suspicious IPs</span>
                </h2>
                <span className="text-[11px] text-red-400 font-mono">High Risk</span>
              </div>
              <div className="h-64">
                {charts?.top_suspicious_ips ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.top_suspicious_ips} layout="vertical">
                      <XAxis type="number" stroke="#475569" fontSize={11} fontFamily="monospace" />
                      <YAxis type="category" dataKey="ip_address" stroke="#475569" fontSize={11} fontFamily="monospace" width={110} />
                      <Tooltip contentStyle={{ backgroundColor: '#121722', borderColor: '#26334a', borderRadius: '12px', fontSize: '12px', fontFamily: 'monospace' }} />
                      <Bar dataKey="failed_attempts" name="Failed" fill="#EF4444" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center text-xs text-gray-500 font-mono">No data</div>}
              </div>
            </div>

            {/* Most Active Participants */}
            <div className="bg-[#1a2234] border border-[#26334a] rounded-2xl p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#26334a]">
                <h2 className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center space-x-2">
                  <span>Most Active Participants</span>
                </h2>
                <span className="text-[11px] text-gray-500 font-mono">By Submissions</span>
              </div>
              <div className="h-64">
                {charts?.most_active_participants ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.most_active_participants}>
                      <XAxis dataKey="username" stroke="#475569" fontSize={11} fontFamily="monospace" />
                      <YAxis stroke="#475569" fontSize={11} fontFamily="monospace" />
                      <Tooltip contentStyle={{ backgroundColor: '#121722', borderColor: '#26334a', borderRadius: '12px', fontSize: '12px', fontFamily: 'monospace' }} />
                      <Bar dataKey="submissions_count" name="Submissions" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center text-xs text-gray-500 font-mono">No data</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ ATTACKS TAB ═══════════════════════════════════════════════════ */}
      {activeTab === 'attacks' && (
        <div className="space-y-6">
          {/* Thresholds */}
          <div className="bg-[#1a2234] border border-[#26334a] rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#26334a]">
              <div className="flex items-center space-x-2">
                <h2 className="text-xs font-bold font-mono text-white uppercase tracking-wider">Brute-Force Detection Thresholds</h2>
              </div>
            </div>
            <form onSubmit={handleSaveThresholds} className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[
                  { key: 'threshold_1min_suspicious', label: 'Burst (1 min)', note: 'Escalates to Suspicious', noteColor: 'text-amber-400' },
                  { key: 'threshold_5min_highrisk', label: 'Sustained (5 min)', note: 'Escalates to High Risk', noteColor: 'text-orange-400' },
                  { key: 'threshold_10min_critical', label: 'Critical (10 min)', note: 'Triggers Rate-Limit', noteColor: 'text-red-400' },
                ].map(({ key, label, note, noteColor }) => (
                  <div key={key} className="bg-[#121722] p-3 rounded-xl border border-[#26334a]">
                    <label className="block text-gray-400 mb-1">{label}</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number" min="1" max="500"
                        value={thresholds[key]}
                        onChange={(e) => setThresholds({ ...thresholds, [key]: parseInt(e.target.value) || 1 })}
                        className="w-full bg-[#1a2234] border border-[#26334a] rounded-lg p-1.5 text-white font-bold text-center focus:border-emerald-400 focus:outline-none"
                      />
                      <span className="text-gray-400 shrink-0">fails</span>
                    </div>
                    <p className={`text-[10px] mt-1 ${noteColor}`}>{note}</p>
                  </div>
                ))}
                <div className="bg-[#121722] p-3 rounded-xl border border-[#26334a] flex flex-col justify-between">
                  <label className="block text-gray-400 mb-1">Backend Enforcement</label>
                  <label className="flex items-center space-x-2 cursor-pointer mt-1">
                    <input type="checkbox" checked={thresholds.enforce_ip_blocking == 1}
                      onChange={(e) => setThresholds({ ...thresholds, enforce_ip_blocking: e.target.checked ? 1 : 0 })}
                      className="rounded bg-[#1a2234] border-[#26334a] text-emerald-500 focus:ring-0" />
                    <span className="text-white text-xs font-semibold">Active Firewall</span>
                  </label>
                  <p className="text-[10px] text-gray-400 mt-1">{thresholds.enforce_ip_blocking == 1 ? 'Hard HTTP 403 block' : 'Warning mark only'}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                {saveMessage && <p className={`text-xs ${saveMessage.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>{saveMessage.text}</p>}
                <div className="ml-auto">
                  <button type="submit" disabled={savingThresholds}
                    className="px-4 py-2 bg-gradient-to-r from-[#059669] to-[#10B981] hover:from-[#047857] hover:to-[#059669] text-white rounded-xl text-xs font-bold transition disabled:opacity-50">
                    {savingThresholds ? 'Updating...' : 'Save & Deploy Rules'}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Attacks table */}
          <div className="bg-[#1a2234] border border-[#26334a] rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold font-mono text-white uppercase tracking-wider">Flag Brute-Force Monitor</h2>
                <span className="text-xs text-gray-400 font-mono">({filteredAttacks.length})</span>
              </div>
              <div className="relative w-full sm:w-72">
                <input type="text" value={attackSearch} onChange={(e) => setAttackSearch(e.target.value)}
                  placeholder="Search participant or IP..."
                  className="w-full bg-[#121722] border border-[#26334a] rounded-xl pl-8 pr-3 py-1.5 text-xs font-mono text-white placeholder-gray-500 focus:border-emerald-400 focus:outline-none transition" />
              </div>
            </div>
            <div className="overflow-x-auto border border-[#26334a] rounded-xl">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#161c2d] text-gray-400 border-b border-[#26334a] uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-4 py-3">Participant</th><th className="px-4 py-3">IP</th>
                    <th className="px-4 py-3">Challenge</th><th className="px-4 py-3">Failed</th>
                    <th className="px-4 py-3">Threat</th><th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#26334a]/80">
                  {attacksLoading ? (
                    <tr><td colSpan="7" className="px-4 py-12 text-center text-gray-400">Scanning incidents...</td></tr>
                  ) : filteredAttacks.length === 0 ? (
                    <tr><td colSpan="7" className="px-4 py-12 text-center text-gray-500">No suspicious activity detected.</td></tr>
                  ) : filteredAttacks.map((row, i) => (
                    <tr key={i} className="hover:bg-[#1f283a] transition">
                      <td className="px-4 py-3 text-white font-bold whitespace-nowrap">{row.participant}</td>
                      <td className="px-4 py-3 text-emerald-400 font-bold whitespace-nowrap">{row.ip_address}</td>
                      <td className="px-4 py-3 text-gray-200 whitespace-nowrap">{row.challenge}</td>
                      <td className="px-4 py-3 text-red-400 font-bold whitespace-nowrap">{row.failed_attempts}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase border ${getThreatBadge(row.threat_level)}`}>{row.threat_level}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase border ${getStatusBadge(row.status)}`}>{row.status}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setInvestigatingIp(row.ip_address)}
                          className="px-2.5 py-1 rounded-lg bg-[#121722] hover:bg-[#202b3d] border border-[#26334a] hover:border-emerald-400/50 text-emerald-400 text-[11px] font-bold flex items-center space-x-1 ml-auto transition">
                          <span>Investigate</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══ IP FILTER TAB ═════════════════════════════════════════════════ */}
      {activeTab === 'ip' && (
        <div className="space-y-6">
          <div className="bg-[#1a2234] border border-[#26334a] rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto">
              {[{ id: 'all', label: 'All' }, { id: 'blocked', label: 'Blocked' }, { id: 'suspicious', label: 'Suspicious' }, { id: 'whitelisted', label: 'Whitelisted' }].map(t => (
                <button key={t.id} onClick={() => setIpFilter(t.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition border ${ipFilter === t.id ? 'bg-emerald-400 text-slate-950 border-emerald-400 font-bold shadow-md' : 'bg-[#121722] text-gray-400 border-[#26334a] hover:text-white'}`}>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-60">
                <input type="text" value={ipSearch} onChange={(e) => setIpSearch(e.target.value)}
                  placeholder="Search IP..."
                  className="w-full bg-[#121722] border border-[#26334a] rounded-xl pl-8 pr-3 py-1.5 text-xs font-mono text-white placeholder-gray-500 focus:border-emerald-400 focus:outline-none transition" />
              </div>
              <button onClick={() => setShowAddIpModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-[#059669] to-[#10B981] hover:from-[#047857] hover:to-[#059669] text-white rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 transition shadow-md shadow-emerald-900/30">
                <span>Add IP Rule</span>
              </button>
            </div>
          </div>

          <div className="bg-[#1a2234] border border-[#26334a] rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#161c2d] text-gray-400 border-b border-[#26334a] uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5">IP Address</th><th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Threat</th><th className="px-5 py-3.5">Failed</th>
                    <th className="px-5 py-3.5">Enforcement</th><th className="px-5 py-3.5">Reason</th>
                    <th className="px-5 py-3.5 text-right">Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#26334a]/80">
                  {ipLoading ? (
                    <tr><td colSpan="7" className="px-5 py-12 text-center text-gray-400">Loading IPs...</td></tr>
                  ) : filteredIps.length === 0 ? (
                    <tr><td colSpan="7" className="px-5 py-12 text-center text-gray-500">No IP entries found.</td></tr>
                  ) : filteredIps.map((row) => (
                    <tr key={row.id} className="hover:bg-[#1f283a] transition">
                      <td className="px-5 py-3.5 font-bold text-white whitespace-nowrap">{row.ip_address}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusBadge(row.status)}`}>{row.status}</span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase border ${getThreatBadge(row.threat_level)}`}>{row.threat_level}</span>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-red-400">{row.failed_attempts_count}</td>
                      <td className="px-5 py-3.5">
                        {row.is_enforced
                          ? <span className="flex items-center space-x-1 text-emerald-400 text-[11px] font-bold"><span>Enforced</span></span>
                          : <span className="flex items-center space-x-1 text-amber-400 text-[11px]"><span>Marked</span></span>}
                      </td>
                      <td className="px-5 py-3.5 text-gray-300 max-w-xs truncate" title={row.reason}>{row.reason || '—'}</td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button onClick={() => setInvestigatingIp(row.ip_address)}
                            className="px-2.5 py-1 rounded-lg bg-[#121722] hover:bg-[#202b3d] border border-[#26334a] hover:border-emerald-400/50 text-emerald-400 text-[11px] font-bold flex items-center space-x-1 transition">
                            <span>Profile</span>
                          </button>
                          {row.status !== 'blocked'
                            ? <button onClick={() => handleQuickIpAction(row.ip_address, 'block')} className="px-2 py-1 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 text-[11px] font-bold transition">Block</button>
                            : <button onClick={() => handleQuickIpAction(row.ip_address, 'unblock')} className="px-2 py-1 rounded-lg bg-[#121722] hover:bg-[#202b3d] border border-[#26334a] text-gray-300 text-[11px] font-bold transition">Unblock</button>}
                          {row.status !== 'whitelisted' &&
                            <button onClick={() => handleQuickIpAction(row.ip_address, 'whitelist')} className="px-2 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-[11px] font-bold transition">Whitelist</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add IP Modal */}
          {showAddIpModal && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-[#1a2234] border border-[#26334a] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white">Apply IP Policy</h3>
                  <button onClick={() => setShowAddIpModal(false)} className="text-gray-400 hover:text-white">✕</button>
                </div>
                <form onSubmit={handleManualIpAction} className="space-y-3">
                  <div>
                    <label className="block text-gray-400 mb-1">IP Address</label>
                    <input type="text" value={newIp} onChange={(e) => setNewIp(e.target.value)} placeholder="192.168.1.100" required
                      className="w-full bg-[#121722] border border-[#26334a] rounded-xl p-2.5 text-white focus:border-emerald-400 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Policy</label>
                    <select value={newAction} onChange={(e) => setNewAction(e.target.value)}
                      className="w-full bg-[#121722] border border-[#26334a] rounded-xl p-2.5 text-white focus:border-emerald-400 focus:outline-none">
                      <option value="block">Block (HTTP 403)</option>
                      <option value="whitelist">Whitelist</option>
                      <option value="unblock">Unblock / Reset</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Notes</label>
                    <input type="text" value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="Reason..."
                      className="w-full bg-[#121722] border border-[#26334a] rounded-xl p-2.5 text-white focus:border-emerald-400 focus:outline-none" />
                  </div>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" checked={newEnforced} onChange={(e) => setNewEnforced(e.target.checked)} className="rounded bg-[#121722] border-[#26334a] text-emerald-500 focus:ring-0" />
                    <span className="text-gray-300">Enforce immediately</span>
                  </label>
                  <div className="flex justify-end space-x-2 pt-3 border-t border-[#26334a]">
                    <button type="button" onClick={() => setShowAddIpModal(false)} className="px-4 py-2 bg-[#121722] hover:bg-[#202b3d] text-gray-300 border border-[#26334a] rounded-xl transition">Cancel</button>
                    <button type="submit" disabled={actionLoading} className="px-5 py-2 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold rounded-xl transition disabled:opacity-50">
                      {actionLoading ? 'Applying...' : 'Apply Policy'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ LOGS TAB ══════════════════════════════════════════════════════ */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-[#1a2234] border border-[#26334a] rounded-2xl p-4 shadow-lg flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <input type="text" value={logsSearch} onChange={(e) => setLogsSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadLogs()}
                placeholder="Search logs... (press Enter)"
                className="w-full bg-[#121722] border border-[#26334a] rounded-xl pl-8 pr-3 py-1.5 text-xs font-mono text-white placeholder-gray-500 focus:border-emerald-400 focus:outline-none transition" />
            </div>
            <select value={logsEventType} onChange={(e) => { setLogsEventType(e.target.value); setLogsPage(1); }}
              className="bg-[#121722] border border-[#26334a] rounded-xl p-2 text-xs font-mono text-white focus:border-emerald-400 focus:outline-none">
              {EVENT_TYPES.map(et => <option key={et} value={et}>{et === 'ALL' ? 'All Events' : et.replace(/_/g, ' ')}</option>)}
            </select>
            <select value={logsThreatLevel} onChange={(e) => { setLogsThreatLevel(e.target.value); setLogsPage(1); }}
              className="bg-[#121722] border border-[#26334a] rounded-xl p-2 text-xs font-mono text-white focus:border-emerald-400 focus:outline-none">
              {THREAT_LEVELS.map(tl => <option key={tl} value={tl}>{tl === 'ALL' ? 'All Threat Levels' : tl}</option>)}
            </select>
            <span className="text-xs text-gray-400 font-mono ml-auto">{logsTotal} total</span>
          </div>

          <div className="bg-[#1a2234] border border-[#26334a] rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#161c2d] text-gray-400 border-b border-[#26334a] uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5">Time</th><th className="px-5 py-3.5">Event Type</th>
                    <th className="px-5 py-3.5">User</th><th className="px-5 py-3.5">IP</th>
                    <th className="px-5 py-3.5">Threat</th><th className="px-5 py-3.5">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#26334a]/80">
                  {logsLoading ? (
                    <tr><td colSpan="6" className="px-5 py-12 text-center text-gray-400">Loading logs...</td></tr>
                  ) : logs.length === 0 ? (
                    <tr><td colSpan="6" className="px-5 py-12 text-center text-gray-500">No logs found.</td></tr>
                  ) : logs.map((log, i) => (
                    <tr key={i} className="hover:bg-[#1f283a] transition">
                      <td className="px-5 py-3 text-gray-400 whitespace-nowrap text-[11px]">{log.created_at}</td>
                      <td className={`px-5 py-3 whitespace-nowrap font-bold text-[11px] ${getLogEventColor(log.event_type)}`}>{(log.event_type || '').replace(/_/g, ' ')}</td>
                      <td className="px-5 py-3 text-white whitespace-nowrap">{log.username || '—'}</td>
                      <td className="px-5 py-3 text-emerald-400 whitespace-nowrap">{log.ip_address || '—'}</td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase border ${getThreatBadge(log.threat_level)}`}>{log.threat_level || 'Low'}</span>
                      </td>
                      <td className="px-5 py-3 text-gray-300 max-w-xs truncate" title={log.message}>{log.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {logsTotalPages > 1 && (
            <div className="flex items-center justify-between">
              <button onClick={() => setLogsPage(p => Math.max(1, p - 1))} disabled={logsPage === 1}
                className="flex items-center space-x-1 px-3 py-2 bg-[#121722] hover:bg-[#202b3d] border border-[#26334a] text-gray-300 rounded-xl text-xs font-mono transition disabled:opacity-40">
                <span>Prev</span>
              </button>
              <span className="text-xs text-gray-400 font-mono">Page {logsPage} / {logsTotalPages}</span>
              <button onClick={() => setLogsPage(p => Math.min(logsTotalPages, p + 1))} disabled={logsPage === logsTotalPages}
                className="flex items-center space-x-1 px-3 py-2 bg-[#121722] hover:bg-[#202b3d] border border-[#26334a] text-gray-300 rounded-xl text-xs font-mono transition disabled:opacity-40">
                <span>Next</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Investigate modal (shared) */}
      {investigatingIp && (
        <InvestigateIpModal
          ip={investigatingIp}
          onClose={() => setInvestigatingIp(null)}
          onActionSuccess={() => { if (activeTab === 'attacks') loadAttacks(); else loadIps(); }}
        />
      )}
    </div>
  );
}

