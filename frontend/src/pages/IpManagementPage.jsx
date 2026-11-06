import React, { useEffect, useState } from 'react';
import { 
  Server, ShieldAlert, ShieldCheck, Ban, CheckCircle2, History, 
  Search, Plus, AlertCircle, RefreshCw, Eye
} from 'lucide-react';
import { api } from '../services/api';
import InvestigateIpModal from '../components/InvestigateIpModal';

export default function IpManagementPage() {
  const [ips, setIps] = useState([]);
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [newIp, setNewIp] = useState('');
  const [newAction, setNewAction] = useState('block');
  const [newNotes, setNewNotes] = useState('');
  const [newEnforced, setNewEnforced] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [investigatingIp, setInvestigatingIp] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    setLoading(true);
    const [ipsRes, histRes] = await Promise.all([
      api.getIps(filter),
      api.getIpActionsHistory()
    ]);

    if (ipsRes.status === 'success' && ipsRes.ips) {
      setIps(ipsRes.ips);
    }
    if (histRes.status === 'success' && histRes.history) {
      setHistory(histRes.history);
    }
    setLoading(false);
  };

  const handleManualAction = async (e) => {
    e.preventDefault();
    if (!newIp.trim()) return;

    setActionLoading(true);
    const res = await api.manageIp(newAction, {
      ip_address: newIp.trim(),
      notes: newNotes.trim(),
      is_enforced: newEnforced ? 1 : 0
    });
    setActionLoading(false);

    if (res.status === 'success') {
      setNewIp('');
      setNewNotes('');
      setShowAddModal(false);
      loadData();
    } else {
      alert(res.message || 'Operation failed');
    }
  };

  const handleQuickAction = async (ip, action) => {
    const res = await api.manageIp(action, {
      ip_address: ip,
      notes: `Quick action: ${action} from IP management table`,
      is_enforced: 1
    });
    if (res.status === 'success') {
      loadData();
    }
  };

  const filteredIps = ips.filter(ip => 
    ip.ip_address.toLowerCase().includes(search.toLowerCase()) ||
    (ip.reason && ip.reason.toLowerCase().includes(search.toLowerCase()))
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case 'blocked': return 'bg-red-950 text-red-400 border-red-800 font-bold';
      case 'rate_limited': return 'bg-amber-950 text-amber-400 border-amber-800 font-bold';
      case 'suspicious': return 'bg-orange-950 text-orange-400 border-orange-800 font-bold';
      case 'whitelisted': return 'bg-emerald-950 text-emerald-400 border-emerald-800 font-bold';
      default: return 'bg-[#121722] text-gray-300 border-[#26334a]';
    }
  };

  const getThreatBadge = (level) => {
    switch (level) {
      case 'Critical': return 'text-red-400 bg-red-950/60 border-red-800 font-bold';
      case 'High': return 'text-orange-400 bg-orange-950/60 border-orange-800 font-bold';
      case 'Medium': return 'text-[#F59E0B] bg-amber-950/60 border-amber-800';
      default: return 'text-[#10B981] bg-emerald-950/60 border-emerald-800';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-[#1a2234] border border-[#26334a] rounded-2xl p-6 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-emerald-950/80 border border-emerald-800/80 rounded-xl text-[#10B981] shadow-lg shadow-emerald-950/50">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black text-white tracking-tight font-mono">
                IP Access Control & Security Filter
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 border border-emerald-800 text-[#10B981]">
                BACKEND ENFORCED
              </span>
            </div>
            <p className="text-xs text-gray-400 font-mono">
              Manage IP bans, whitelisting, threat containment, and inspect enforcement status.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="px-3.5 py-2 bg-[#121722] hover:bg-[#202b3d] border border-[#26334a] text-gray-300 rounded-xl text-xs font-mono flex items-center space-x-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-[#059669] to-[#10B981] hover:from-[#047857] hover:to-[#059669] text-white rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 transition shadow-md shadow-emerald-900/30"
          >
            <Plus className="w-4 h-4" />
            <span>Add / Rule IP</span>
          </button>
        </div>
      </div>

      {/* Manual Rule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1a2234] border border-[#26334a] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <h3 className="text-base font-bold text-white font-mono">Apply Custom IP Policy</h3>
            
            <form onSubmit={handleManualAction} className="space-y-3">
              <div>
                <label className="block text-gray-400 mb-1">Target IP Address</label>
                <input
                  type="text"
                  value={newIp}
                  onChange={(e) => setNewIp(e.target.value)}
                  placeholder="e.g. 192.168.1.100"
                  required
                  className="w-full bg-[#121722] border border-[#26334a] rounded-xl p-2.5 text-white focus:border-[#10B981] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Policy Action</label>
                <select
                  value={newAction}
                  onChange={(e) => setNewAction(e.target.value)}
                  className="w-full bg-[#121722] border border-[#26334a] rounded-xl p-2.5 text-white focus:border-[#10B981] focus:outline-none"
                >
                  <option value="block">Block IP (HTTP 403 Forbidden)</option>
                  <option value="whitelist">Whitelist IP (Bypass Heuristics)</option>
                  <option value="unblock">Unblock / Reset to Normal</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Administrative Notes</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Reason for blocking or whitelisting..."
                  className="w-full bg-[#121722] border border-[#26334a] rounded-xl p-2.5 text-white focus:border-[#10B981] focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="enforceCheck"
                  checked={newEnforced}
                  onChange={(e) => setNewEnforced(e.target.checked)}
                  className="rounded bg-[#121722] border-[#26334a] text-emerald-500 focus:ring-0"
                />
                <label htmlFor="enforceCheck" className="text-gray-300 cursor-pointer">
                  Enforce immediately in PHP backend middleware
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-[#26334a]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-[#121722] hover:bg-[#202b3d] text-gray-300 border border-[#26334a] rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold rounded-xl transition disabled:opacity-50"
                >
                  {actionLoading ? 'Applying...' : 'Apply IP Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="bg-[#1a2234] border border-[#26334a] rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'all', label: 'All Monitored' },
            { id: 'blocked', label: 'Blocked Only' },
            { id: 'suspicious', label: 'Suspicious' },
            { id: 'whitelisted', label: 'Whitelisted' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition border ${
                filter === t.id 
                  ? 'bg-[#10B981] text-slate-950 border-[#10B981] font-bold shadow-md' 
                  : 'bg-[#121722] text-gray-400 border-[#26334a] hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="w-3.5 h-3.5 text-[#10B981]" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search IP or reason..."
            className="w-full bg-[#121722] border border-[#26334a] rounded-xl pl-8 pr-3 py-1.5 text-xs font-mono text-white placeholder-gray-500 focus:border-[#10B981] transition"
          />
        </div>
      </div>

      {/* Main IP Table */}
      <div className="bg-[#1a2234] border border-[#26334a] rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#161c2d] text-gray-400 border-b border-[#26334a] uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">IP Address</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Threat Level</th>
                <th className="px-5 py-3.5">Failed Count</th>
                <th className="px-5 py-3.5">Enforcement</th>
                <th className="px-5 py-3.5">Detection Trigger / Reason</th>
                <th className="px-5 py-3.5 text-right">Remediation Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#26334a]/80">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-5 py-12 text-center text-gray-400">
                    Loading IP access control list...
                  </td>
                </tr>
              ) : filteredIps.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-12 text-center text-gray-500">
                    No IP addresses found under the selected filter.
                  </td>
                </tr>
              ) : (
                filteredIps.map((row) => (
                  <tr key={row.id} className="hover:bg-[#1f283a] transition">
                    <td className="px-5 py-3.5 font-bold text-white whitespace-nowrap">
                      {row.ip_address}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusBadge(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase border ${getThreatBadge(row.threat_level)}`}>
                        {row.threat_level}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-red-400 whitespace-nowrap">
                      {row.failed_attempts_count}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {row.is_enforced ? (
                        <span className="flex items-center space-x-1 text-[#10B981] text-[11px] font-bold">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Enforced</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1 text-amber-400 text-[11px]">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Marked Only</span>
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-gray-300 max-w-xs truncate" title={row.reason}>
                      {row.reason || 'No specific alert trigger'}
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setInvestigatingIp(row.ip_address)}
                          className="px-2.5 py-1 rounded-lg bg-[#121722] hover:bg-[#202b3d] border border-[#26334a] hover:border-[#10B981]/50 text-[#10B981] text-[11px] font-bold flex items-center space-x-1 transition"
                          title="View Forensic Timeline"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Profile</span>
                        </button>

                        {row.status !== 'blocked' ? (
                          <button
                            onClick={() => handleQuickAction(row.ip_address, 'block')}
                            className="px-2 py-1 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 text-[11px] font-bold transition"
                          >
                            Block
                          </button>
                        ) : (
                          <button
                            onClick={() => handleQuickAction(row.ip_address, 'unblock')}
                            className="px-2 py-1 rounded-lg bg-[#121722] hover:bg-[#202b3d] border border-[#26334a] text-gray-300 text-[11px] font-bold transition"
                          >
                            Unblock
                          </button>
                        )}

                        {row.status !== 'whitelisted' && (
                          <button
                            onClick={() => handleQuickAction(row.ip_address, 'whitelist')}
                            className="px-2 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-[11px] font-bold transition"
                          >
                            Whitelist
                          </button>
                        )}
                      </div>
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
