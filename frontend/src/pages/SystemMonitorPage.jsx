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
      case 'Critical': return 'bg-rose-50 text-rose-700 border-rose-300 font-bold';
      case 'High': return 'bg-orange-50 text-orange-700 border-orange-300 font-bold';
      case 'Medium': return 'bg-amber-50 text-amber-700 border-amber-300';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'blocked': return 'bg-rose-50 text-rose-700 border-rose-300 font-bold';
      case 'rate_limited': return 'bg-amber-50 text-amber-700 border-amber-300 font-bold';
      case 'suspicious': return 'bg-orange-50 text-orange-700 border-orange-300 font-bold';
      case 'whitelisted': return 'bg-emerald-50 text-[#006633] border-emerald-300 font-bold';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getLogEventColor = (et) => {
    if (!et) return 'text-slate-400';
    if (et.includes('SUCCESS')) return 'text-[#006633]';
    if (et.includes('FAILED') || et.includes('HIGH_RISK') || et.includes('CRITICAL') || et.includes('BLOCKED')) return 'text-rose-600';
    if (et.includes('SUSPICIOUS') || et.includes('RATE_LIMITED')) return 'text-amber-600';
    if (et.includes('AUTH')) return 'text-blue-600';
    if (et.includes('ADMIN')) return 'text-purple-600';
    return 'text-slate-700';
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#006633]" />
        <div className="absolute top-1 left-0 right-0 h-0.5 bg-[#eab308]" />

        <div className="pt-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-mono">System Monitor</h1>
          <p className="text-xs text-slate-500 font-mono">Real-time telemetry, brute-force monitoring, and IP filtering</p>
        </div>
        <button
          onClick={() => { if (activeTab === 'overview') loadOverview(); else if (activeTab === 'attacks') loadAttacks(); else if (activeTab === 'ip') loadIps(); else loadLogs(); }}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-xl text-xs font-mono flex items-center space-x-1.5 transition-colors"
        >
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-1 bg-slate-100 border border-slate-200 rounded-xl p-1">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex-1 justify-center ${activeTab === id
                ? 'bg-white border border-slate-200 text-[#006633] shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
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
              { label: 'Competitors', value: stats?.total_participants ?? 0, color: 'text-slate-900' },
              { label: 'Active (24h)', value: stats?.active_participants ?? 0, color: 'text-[#006633]' },
              { label: 'Total Guesses', value: stats?.total_submissions ?? 0, color: 'text-slate-900' },
              { label: 'Correct Flags', value: stats?.correct_submissions ?? 0, color: 'text-[#006633]' },
              { label: 'Incorrect', value: stats?.incorrect_submissions ?? 0, color: 'text-rose-600' },
              { label: 'Flagged IPs', value: stats?.suspicious_ips ?? 0, color: 'text-amber-600' },
              { label: 'Brute Detected', value: stats?.detected_brute_force ?? 0, color: 'text-rose-600' },
              { label: 'Active Alerts', value: stats?.active_suspicious_activity ?? 0, color: 'text-rose-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                <div className="text-[10px] uppercase text-slate-500 truncate">{label}</div>
                <div className={`text-xl font-bold mt-1 ${color}`}>{value}</div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h2 className="text-xs font-bold font-mono text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                  <span>Flag Accuracy</span>
                </h2>
                <span className="text-[11px] text-slate-400 font-mono">Cumulative</span>
              </div>
              <div className="h-64">
                {charts?.success_vs_failed ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={charts.success_vs_failed} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value">
                        {charts.success_vs_failed.map((e, i) => <Cell key={i} fill={e.fill || COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px', fontFamily: 'monospace', color: '#0f172a' }} />
                      <Legend wrapperStyle={{ fontSize: '12px', fontFamily: 'monospace' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center text-xs text-slate-400 font-mono">No data</div>}
              </div>
            </div>

            {/* Area */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h2 className="text-xs font-bold font-mono text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                  <span>Submission Volume</span>
                </h2>
                <span className="text-[11px] text-slate-400 font-mono">Hourly</span>
              </div>
              <div className="h-64">
                {charts?.submissions_over_time ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={charts.submissions_over_time}>
                      <defs>
                        <linearGradient id="cTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#006633" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#006633" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="cFailed" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="hour_label" stroke="#94a3b8" fontSize={11} fontFamily="monospace" />
                      <YAxis stroke="#94a3b8" fontSize={11} fontFamily="monospace" />
                      <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px', fontFamily: 'monospace', color: '#0f172a' }} />
                      <Area type="monotone" dataKey="total" name="Total" stroke="#006633" fillOpacity={1} fill="url(#cTotal)" />
                      <Area type="monotone" dataKey="incorrect" name="Incorrect" stroke="#ef4444" fillOpacity={1} fill="url(#cFailed)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center text-xs text-slate-400 font-mono">No data</div>}
              </div>
            </div>

            {/* Top Suspicious IPs */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h2 className="text-xs font-bold font-mono text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                  <span>Top Suspicious IPs</span>
                </h2>
                <span className="text-[11px] text-rose-600 font-mono font-bold">High Risk</span>
              </div>
              <div className="h-64">
                {charts?.top_suspicious_ips ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.top_suspicious_ips} layout="vertical">
                      <XAxis type="number" stroke="#94a3b8" fontSize={11} fontFamily="monospace" />
                      <YAxis type="category" dataKey="ip_address" stroke="#94a3b8" fontSize={11} fontFamily="monospace" width={110} />
                      <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px', fontFamily: 'monospace', color: '#0f172a' }} />
                      <Bar dataKey="failed_attempts" name="Failed" fill="#ef4444" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center text-xs text-slate-400 font-mono">No data</div>}
              </div>
            </div>

            {/* Most Active Participants */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h2 className="text-xs font-bold font-mono text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                  <span>Most Active Participants</span>
                </h2>
                <span className="text-[11px] text-slate-400 font-mono">By Submissions</span>
              </div>
              <div className="h-64">
                {charts?.most_active_participants ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.most_active_participants}>
                      <XAxis dataKey="username" stroke="#94a3b8" fontSize={11} fontFamily="monospace" />
                      <YAxis stroke="#94a3b8" fontSize={11} fontFamily="monospace" />
                      <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px', fontFamily: 'monospace', color: '#0f172a' }} />
                      <Bar dataKey="submissions_count" name="Submissions" fill="#eab308" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center text-xs text-slate-400 font-mono">No data</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ ATTACKS TAB ═══════════════════════════════════════════════════ */}
      {activeTab === 'attacks' && (
        <div className="space-y-6">
          {/* Thresholds */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <h2 className="text-xs font-bold font-mono text-slate-900 uppercase tracking-wider">Brute-Force Detection Thresholds</h2>
              </div>
            </div>
            <form onSubmit={handleSaveThresholds} className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[
                  { key: 'threshold_1min_suspicious', label: 'Burst (1 min)', note: 'Escalates to Suspicious', noteColor: 'text-amber-600' },
                  { key: 'threshold_5min_highrisk', label: 'Sustained (5 min)', note: 'Escalates to High Risk', noteColor: 'text-orange-600' },
                  { key: 'threshold_10min_critical', label: 'Critical (10 min)', note: 'Triggers Rate-Limit', noteColor: 'text-rose-600' },
                ].map(({ key, label, note, noteColor }) => (
                  <div key={key} className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <label className="block text-slate-600 mb-1">{label}</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number" min="1" max="500"
                        value={thresholds[key]}
                        onChange={(e) => setThresholds({ ...thresholds, [key]: parseInt(e.target.value) || 1 })}
                        className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-slate-900 font-bold text-center focus:border-[#006633] focus:outline-none"
                      />
                      <span className="text-slate-500 shrink-0">fails</span>
                    </div>
                    <p className={`text-[10px] mt-1 ${noteColor}`}>{note}</p>
                  </div>
                ))}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <label className="block text-slate-600 mb-1">Backend Enforcement</label>
                  <label className="flex items-center space-x-2 cursor-pointer mt-1">
                    <input type="checkbox" checked={thresholds.enforce_ip_blocking == 1}
                      onChange={(e) => setThresholds({ ...thresholds, enforce_ip_blocking: e.target.checked ? 1 : 0 })}
                      className="rounded bg-white border-slate-300 text-[#006633] focus:ring-0" />
                    <span className="text-slate-900 text-xs font-semibold">Active Firewall</span>
                  </label>
                  <p className="text-[10px] text-slate-500 mt-1">{thresholds.enforce_ip_blocking == 1 ? 'Hard HTTP 403 block' : 'Warning mark only'}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                {saveMessage && <p className={`text-xs ${saveMessage.type === 'success' ? 'text-[#006633]' : 'text-rose-600'}`}>{saveMessage.text}</p>}
                <div className="ml-auto">
                  <button type="submit" disabled={savingThresholds}
                    className="px-4 py-2 bg-[#006633] hover:bg-[#004d26] text-white rounded-xl text-xs font-bold transition-colors shadow-sm disabled:opacity-50">
                    {savingThresholds ? 'Updating...' : 'Save & Deploy Rules'}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Attacks table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold font-mono text-slate-900 uppercase tracking-wider">Flag Brute-Force Monitor</h2>
                <span className="text-xs text-slate-500 font-mono">({filteredAttacks.length})</span>
              </div>
              <div className="relative w-full sm:w-72">
                <input type="text" value={attackSearch} onChange={(e) => setAttackSearch(e.target.value)}
                  placeholder="Search participant or IP..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-900 placeholder-slate-400 focus:border-[#006633] focus:outline-none transition-colors" />
              </div>
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-4 py-3">Participant</th><th className="px-4 py-3">IP</th>
                    <th className="px-4 py-3">Challenge</th><th className="px-4 py-3">Failed</th>
                    <th className="px-4 py-3">Threat</th><th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attacksLoading ? (
                    <tr><td colSpan="7" className="px-4 py-12 text-center text-slate-400">Scanning incidents...</td></tr>
                  ) : filteredAttacks.length === 0 ? (
                    <tr><td colSpan="7" className="px-4 py-12 text-center text-slate-500">No suspicious activity detected.</td></tr>
                  ) : filteredAttacks.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-slate-900 font-bold whitespace-nowrap">{row.participant}</td>
                      <td className="px-4 py-3 text-[#006633] font-bold whitespace-nowrap">{row.ip_address}</td>
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{row.challenge}</td>
                      <td className="px-4 py-3 text-rose-600 font-bold whitespace-nowrap">{row.failed_attempts}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase border ${getThreatBadge(row.threat_level)}`}>{row.threat_level}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase border ${getStatusBadge(row.status)}`}>{row.status}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setInvestigatingIp(row.ip_address)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-[#006633] text-[11px] font-bold flex items-center space-x-1 ml-auto transition-colors">
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
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto">
              {[{ id: 'all', label: 'All' }, { id: 'blocked', label: 'Blocked' }, { id: 'suspicious', label: 'Suspicious' }, { id: 'whitelisted', label: 'Whitelisted' }].map(t => (
                <button key={t.id} onClick={() => setIpFilter(t.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition-colors border ${ipFilter === t.id ? 'bg-[#006633] text-white border-[#006633] font-bold shadow-sm' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'}`}>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-60">
                <input type="text" value={ipSearch} onChange={(e) => setIpSearch(e.target.value)}
                  placeholder="Search IP..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-900 placeholder-slate-400 focus:border-[#006633] focus:outline-none transition-colors" />
              </div>
              <button onClick={() => setShowAddIpModal(true)}
                className="px-4 py-2 bg-[#006633] hover:bg-[#004d26] text-white rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 transition-colors shadow-sm">
                <span>Add IP Rule</span>
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5">IP Address</th><th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Threat</th><th className="px-5 py-3.5">Failed</th>
                    <th className="px-5 py-3.5">Enforcement</th><th className="px-5 py-3.5">Reason</th>
                    <th className="px-5 py-3.5 text-right">Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ipLoading ? (
                    <tr><td colSpan="7" className="px-5 py-12 text-center text-slate-400">Loading IPs...</td></tr>
                  ) : filteredIps.length === 0 ? (
                    <tr><td colSpan="7" className="px-5 py-12 text-center text-slate-500">No IP entries found.</td></tr>
                  ) : filteredIps.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900 whitespace-nowrap">{row.ip_address}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusBadge(row.status)}`}>{row.status}</span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase border ${getThreatBadge(row.threat_level)}`}>{row.threat_level}</span>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-rose-600">{row.failed_attempts_count}</td>
                      <td className="px-5 py-3.5">
                        {row.is_enforced
                          ? <span className="flex items-center space-x-1 text-[#006633] text-[11px] font-bold"><span>Enforced</span></span>
                          : <span className="flex items-center space-x-1 text-amber-600 text-[11px]"><span>Marked</span></span>}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 max-w-xs truncate" title={row.reason}>{row.reason || '—'}</td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button onClick={() => setInvestigatingIp(row.ip_address)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-[#006633] text-[11px] font-bold flex items-center space-x-1 transition-colors">
                            <span>Profile</span>
                          </button>
                          {row.status !== 'blocked'
                            ? <button onClick={() => handleQuickIpAction(row.ip_address, 'block')} className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 text-[11px] font-bold transition-colors">Block</button>
                            : <button onClick={() => handleQuickIpAction(row.ip_address, 'unblock')} className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-[11px] font-bold transition-colors">Unblock</button>}
                          {row.status !== 'whitelisted' &&
                            <button onClick={() => handleQuickIpAction(row.ip_address, 'whitelist')} className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-[#006633] text-[11px] font-bold transition-colors">Whitelist</button>}
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
            <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900">Apply IP Policy</h3>
                  <button onClick={() => setShowAddIpModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
                </div>
                <form onSubmit={handleManualIpAction} className="space-y-3">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">IP Address</label>
                    <input type="text" value={newIp} onChange={(e) => setNewIp(e.target.value)} placeholder="192.168.1.100" required
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:border-[#006633] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Policy</label>
                    <select value={newAction} onChange={(e) => setNewAction(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:border-[#006633] focus:outline-none">
                      <option value="block">Block (HTTP 403)</option>
                      <option value="whitelist">Whitelist</option>
                      <option value="unblock">Unblock / Reset</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Notes</label>
                    <input type="text" value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="Reason..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:border-[#006633] focus:outline-none" />
                  </div>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" checked={newEnforced} onChange={(e) => setNewEnforced(e.target.checked)} className="rounded bg-slate-50 border-slate-300 text-[#006633] focus:ring-0" />
                    <span className="text-slate-700">Enforce immediately</span>
                  </label>
                  <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                    <button type="button" onClick={() => setShowAddIpModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl transition-colors font-medium">Cancel</button>
                    <button type="submit" disabled={actionLoading} className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50">
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
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <input type="text" value={logsSearch} onChange={(e) => setLogsSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadLogs()}
                placeholder="Search logs... (press Enter)"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-900 placeholder-slate-400 focus:border-[#006633] focus:outline-none transition-colors" />
            </div>
            <select value={logsEventType} onChange={(e) => { setLogsEventType(e.target.value); setLogsPage(1); }}
              className="bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-mono text-slate-900 focus:border-[#006633] focus:outline-none">
              {EVENT_TYPES.map(et => <option key={et} value={et}>{et === 'ALL' ? 'All Events' : et.replace(/_/g, ' ')}</option>)}
            </select>
            <select value={logsThreatLevel} onChange={(e) => { setLogsThreatLevel(e.target.value); setLogsPage(1); }}
              className="bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-mono text-slate-900 focus:border-[#006633] focus:outline-none">
              {THREAT_LEVELS.map(tl => <option key={tl} value={tl}>{tl === 'ALL' ? 'All Threat Levels' : tl}</option>)}
            </select>
            <span className="text-xs text-slate-500 font-mono ml-auto">{logsTotal} total</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5">Time</th><th className="px-5 py-3.5">Event Type</th>
                    <th className="px-5 py-3.5">User</th><th className="px-5 py-3.5">IP</th>
                    <th className="px-5 py-3.5">Threat</th><th className="px-5 py-3.5">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logsLoading ? (
                    <tr><td colSpan="6" className="px-5 py-12 text-center text-slate-400">Loading logs...</td></tr>
                  ) : logs.length === 0 ? (
                    <tr><td colSpan="6" className="px-5 py-12 text-center text-slate-500">No logs found.</td></tr>
                  ) : logs.map((log, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 text-slate-500 whitespace-nowrap text-[11px]">{log.created_at}</td>
                      <td className={`px-5 py-3 whitespace-nowrap font-bold text-[11px] ${getLogEventColor(log.event_type)}`}>{(log.event_type || '').replace(/_/g, ' ')}</td>
                      <td className="px-5 py-3 text-slate-900 font-bold whitespace-nowrap">{log.username || '—'}</td>
                      <td className="px-5 py-3 text-[#006633] font-bold whitespace-nowrap">{log.ip_address || '—'}</td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase border ${getThreatBadge(log.threat_level)}`}>{log.threat_level || 'Low'}</span>
                      </td>
                      <td className="px-5 py-3 text-slate-700 max-w-xs truncate" title={log.message}>{log.message}</td>
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
                className="flex items-center space-x-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-xl text-xs font-mono transition-colors disabled:opacity-40">
                <span>Prev</span>
              </button>
              <span className="text-xs text-slate-500 font-mono">Page {logsPage} / {logsTotalPages}</span>
              <button onClick={() => setLogsPage(p => Math.min(logsTotalPages, p + 1))} disabled={logsPage === logsTotalPages}
                className="flex items-center space-x-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-xl text-xs font-mono transition-colors disabled:opacity-40">
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

