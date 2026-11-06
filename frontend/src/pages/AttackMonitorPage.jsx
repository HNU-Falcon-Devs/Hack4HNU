import React, { useEffect, useState } from 'react';
import { 
  Activity, ShieldAlert, Sliders, RefreshCw, Eye, Ban, CheckCircle, 
  AlertTriangle, Flame, Shield, Search
} from 'lucide-react';
import { api } from '../services/api';
import InvestigateIpModal from '../components/InvestigateIpModal';

export default function AttackMonitorPage() {
  const [attacks, setAttacks] = useState([]);
  const [thresholds, setThresholds] = useState({
    threshold_1min_suspicious: 5,
    threshold_5min_highrisk: 10,
    threshold_10min_critical: 20,
    enforce_ip_blocking: 1
  });
  const [loading, setLoading] = useState(true);
  const [savingThresholds, setSavingThresholds] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [investigatingIp, setInvestigatingIp] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [attacksRes, threshRes] = await Promise.all([
      api.getSocAttacks(),
      api.getSocThresholds()
    ]);

    if (attacksRes.status === 'success' && attacksRes.attacks) {
      setAttacks(attacksRes.attacks);
    }
    if (threshRes.status === 'success' && threshRes.thresholds) {
      setThresholds(threshRes.thresholds);
    }
    setLoading(false);
  };

  const handleSaveThresholds = async (e) => {
    e.preventDefault();
    setSavingThresholds(true);
    setSaveMessage(null);

    const res = await api.updateSocThresholds(thresholds);
    setSavingThresholds(false);

    if (res.status === 'success') {
      setSaveMessage({ type: 'success', text: 'Threshold rules successfully updated and deployed to PHP detection engine.' });
      loadData();
    } else {
      setSaveMessage({ type: 'error', text: res.message || 'Failed to update thresholds' });
    }
  };

  const filteredAttacks = attacks.filter(a => 
    a.participant.toLowerCase().includes(search.toLowerCase()) ||
    a.ip_address.toLowerCase().includes(search.toLowerCase()) ||
    a.challenge.toLowerCase().includes(search.toLowerCase())
  );

  const getThreatBadge = (level) => {
    switch (level) {
      case 'Critical': return 'bg-red-950/90 text-red-400 border-red-700 font-bold';
      case 'High': return 'bg-orange-950/90 text-orange-400 border-orange-700 font-bold';
      case 'Medium': return 'bg-amber-950/90 text-amber-400 border-amber-700';
      default: return 'bg-gray-900 text-gray-300 border-gray-700';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'blocked': return 'bg-red-600/20 text-red-400 border-red-500/50';
      case 'rate_limited': return 'bg-amber-600/20 text-amber-400 border-amber-500/50';
      case 'suspicious': return 'bg-orange-600/20 text-orange-400 border-orange-500/50';
      case 'whitelisted': return 'bg-blue-600/20 text-blue-400 border-blue-500/50';
      default: return 'bg-gray-800 text-gray-300 border-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-red-950/80 border border-red-800/80 rounded-xl text-red-400 shadow-lg shadow-red-950/50">
            <Flame className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-extrabold text-white tracking-tight font-mono">
                Live Attack & Flag Brute-Force Monitor
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 border border-red-800 text-red-400">
                ACTIVE HEURISTICS
              </span>
            </div>
            <p className="text-xs text-gray-400 font-mono">
              Detects rapid submission anomalies, credential guessing, and coordinated IP sweeps.
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="px-3.5 py-2 bg-[#080D18] hover:bg-gray-800 border border-gray-700 text-gray-300 rounded-lg text-xs font-mono flex items-center space-x-1.5 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Attacks</span>
        </button>
      </div>

      {/* Configurable Thresholds Card */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
              Configurable Brute-Force Detection Thresholds (PHP Heuristics)
            </h2>
          </div>
          <span className="text-[11px] text-gray-400 font-mono">Real-time Backend Enforcement</span>
        </div>

        <form onSubmit={handleSaveThresholds} className="space-y-4 font-mono text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            
            {/* 1 Min Threshold */}
            <div className="bg-[#080D18] p-3 rounded-lg border border-gray-800">
              <label className="block text-gray-400 mb-1">
                Burst Limit (1 Minute)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={thresholds.threshold_1min_suspicious}
                  onChange={(e) => setThresholds({ ...thresholds, threshold_1min_suspicious: parseInt(e.target.value) || 1 })}
                  className="w-full bg-[#111827] border border-gray-700 rounded p-1.5 text-white font-bold text-center focus:border-cyan-400"
                />
                <span className="text-gray-400 shrink-0">fails</span>
              </div>
              <p className="text-[10px] text-amber-400 mt-1">Escalates to Suspicious</p>
            </div>

            {/* 5 Min Threshold */}
            <div className="bg-[#080D18] p-3 rounded-lg border border-gray-800">
              <label className="block text-gray-400 mb-1">
                Sustained (5 Minutes)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={thresholds.threshold_5min_highrisk}
                  onChange={(e) => setThresholds({ ...thresholds, threshold_5min_highrisk: parseInt(e.target.value) || 1 })}
                  className="w-full bg-[#111827] border border-gray-700 rounded p-1.5 text-white font-bold text-center focus:border-cyan-400"
                />
                <span className="text-gray-400 shrink-0">fails</span>
              </div>
              <p className="text-[10px] text-orange-400 mt-1">Escalates to High Risk</p>
            </div>

            {/* 10 Min Threshold */}
            <div className="bg-[#080D18] p-3 rounded-lg border border-gray-800">
              <label className="block text-gray-400 mb-1">
                Critical (10 Minutes)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={thresholds.threshold_10min_critical}
                  onChange={(e) => setThresholds({ ...thresholds, threshold_10min_critical: parseInt(e.target.value) || 1 })}
                  className="w-full bg-[#111827] border border-gray-700 rounded p-1.5 text-white font-bold text-center focus:border-cyan-400"
                />
                <span className="text-gray-400 shrink-0">fails</span>
              </div>
              <p className="text-[10px] text-red-400 mt-1">Triggers Rate-Limit & Lockout</p>
            </div>

            {/* Backend Enforcement Checkbox */}
            <div className="bg-[#080D18] p-3 rounded-lg border border-gray-800 flex flex-col justify-between">
              <label className="block text-gray-400 mb-1">Backend Enforcement</label>
              <label className="flex items-center space-x-2 cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={thresholds.enforce_ip_blocking == 1}
                  onChange={(e) => setThresholds({ ...thresholds, enforce_ip_blocking: e.target.checked ? 1 : 0 })}
                  className="rounded bg-[#111827] border-gray-700 text-cyan-500 focus:ring-0"
                />
                <span className="text-white text-xs font-semibold">Active Backend Firewall</span>
              </label>
              <p className="text-[10px] text-gray-400 mt-1">
                {thresholds.enforce_ip_blocking == 1 ? 'Hard HTTP 403 block' : 'Warning mark only'}
              </p>
            </div>

          </div>

          <div className="flex items-center justify-between pt-1">
            {saveMessage && (
              <p className={`text-xs ${saveMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                {saveMessage.text}
              </p>
            )}
            <div className="ml-auto">
              <button
                type="submit"
                disabled={savingThresholds}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
              >
                {savingThresholds ? 'Updating Thresholds...' : 'Save & Deploy Rules'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Live Attack Monitoring Table */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl overflow-hidden shadow-sm space-y-3 p-5">
        
        {/* Table Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-red-400" />
            <h2 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
              Flag Brute-Force Monitoring Table
            </h2>
            <span className="text-xs text-gray-500 font-mono">({filteredAttacks.length} incidents)</span>
          </div>

          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              <Search className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search participant or IP..."
              className="w-full bg-[#080D18] border border-gray-700 rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono text-white placeholder-gray-500 focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto border border-gray-800 rounded-xl">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0B1120] text-gray-400 border-b border-gray-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Participant</th>
                <th className="px-4 py-3">IP Address</th>
                <th className="px-4 py-3">Target Challenge</th>
                <th className="px-4 py-3">Failed Attempts</th>
                <th className="px-4 py-3">First Attempt</th>
                <th className="px-4 py-3">Last Attempt</th>
                <th className="px-4 py-3">Frequency</th>
                <th className="px-4 py-3">Threat Level</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/80">
              {loading ? (
                <tr>
                  <td colSpan="10" className="px-4 py-12 text-center text-gray-400">
                    Scanning live attack incidents...
                  </td>
                </tr>
              ) : filteredAttacks.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-4 py-12 text-center text-gray-500">
                    No active brute-force or suspicious flag attacks detected.
                  </td>
                </tr>
              ) : (
                filteredAttacks.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-800/40 transition">
                    <td className="px-4 py-3 text-white font-bold whitespace-nowrap">
                      {row.participant}
                    </td>
                    <td className="px-4 py-3 text-cyan-300 font-bold whitespace-nowrap">
                      {row.ip_address}
                    </td>
                    <td className="px-4 py-3 text-gray-200 whitespace-nowrap">
                      {row.challenge}
                    </td>
                    <td className="px-4 py-3 text-red-400 font-bold whitespace-nowrap">
                      {row.failed_attempts}
                    </td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-[11px]">
                      {row.first_attempt}
                    </td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-[11px]">
                      {row.last_attempt}
                    </td>
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap text-[11px]">
                      {row.frequency}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase border ${getThreatBadge(row.threat_level)}`}>
                        {row.threat_level}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase border ${getStatusBadge(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => setInvestigatingIp(row.ip_address)}
                        className="px-2.5 py-1 rounded bg-[#080D18] hover:bg-cyan-950/60 border border-gray-700 hover:border-cyan-500/50 text-cyan-300 text-[11px] font-bold flex items-center space-x-1 ml-auto transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Investigate</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Forensic Investigation Modal */}
      {investigatingIp && (
        <InvestigateIpModal
          ip={investigatingIp}
          onClose={() => setInvestigatingIp(null)}
          onActionSuccess={loadData}
        />
      )}

    </div>
  );
}

