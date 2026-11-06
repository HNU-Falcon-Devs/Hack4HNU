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
      case 'blocked': return 'bg-red-950 text-red-400 border-red-800';
      case 'rate_limited': return 'bg-amber-950 text-amber-400 border-amber-800';
      case 'suspicious': return 'bg-orange-950 text-orange-400 border-orange-800';
      case 'whitelisted': return 'bg-blue-950 text-blue-400 border-blue-800';
      default: return 'bg-gray-800 text-gray-300 border-gray-700';
    }
  };

  const getThreatBadge = (level) => {
    switch (level) {
      case 'Critical': return 'text-red-400 bg-red-950/60 border-red-800';
      case 'High': return 'text-orange-400 bg-orange-950/60 border-orange-800';
      case 'Medium': return 'text-amber-400 bg-amber-950/60 border-amber-800';
      default: return 'text-green-400 bg-green-950/60 border-green-800';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-orange-950/80 border border-orange-800/80 rounded-xl text-orange-400 shadow-lg shadow-orange-950/50">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-extrabold text-white tracking-tight font-mono">
                IP Access Control & Security Filter
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-green-950 border border-green-800 text-green-400">
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
            className="px-3.5 py-2 bg-[#080D18] hover:bg-gray-800 border border-gray-700 text-gray-300 rounded-lg text-xs font-mono flex items-center space-x-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white rounded-lg text-xs font-mono font-bold flex items-center space-x-1.5 transition shadow-lg shadow-orange-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add / Rule IP</span>
          </button>
        </div>
      </div>

      {/* Manual Rule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
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
                  className="w-full bg-[#080D18] border border-gray-700 rounded-lg p-2 text-white focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Policy Action</label>
                <select
                  value={newAction}
                  onChange={(e) => setNewAction(e.target.value)}
                  className="w-full bg-[#080D18] border border-gray-700 rounded-lg p-2 text-white focus:border-cyan-400"
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
                  className="w-full bg-[#080D18] border border-gray-700 rounded-lg p-2 text-white focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="enforceCheck"
                  checked={newEnforced}
                  onChange={(e) => setNewEnforced(e.target.checked)}
                  className="rounded bg-[#080D18] border-gray-700 text-orange-500 focus:ring-0"
                />
                <label htmlFor="enforceCheck" className="text-gray-300 cursor-pointer">
                  Enforce immediately in PHP backend middleware
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition disabled:opacity-50"
                >
                  {actionLoading ? 'Applying...' : 'Apply IP Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
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
              className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition border ${
                filter === t.id 
                  ? 'bg-orange-500/20 text-orange-300 border-orange-500/50 font-bold' 
                  : 'bg-[#080D18] text-gray-400 border-gray-800 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
            <Search className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search IP or reason..."
            className="w-full bg-[#080D18] border border-gray-700 rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono text-white placeholder-gray-500 focus:border-cyan-400"
          />
        </div>
      </div>

      {/* Main IP Table */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0B1120] text-gray-400 border-b border-gray-800 uppercase tracking-wider text-[11px]">
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
            <tbody className="divide-y divide-gray-800/80">
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
                  <tr key={row.id} className="hover:bg-gray-800/30 transition">
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
                        <span className="flex items-center space-x-1 text-green-400 text-[11px]">
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
                          className="px-2 py-1 rounded bg-[#080D18] hover:bg-gray-800 border border-gray-700 text-cyan-300 text-[11px] font-bold flex items-center space-x-1 transition"
                          title="View Forensic Timeline"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Profile</span>
                        </button>

                        {row.status !== 'blocked' ? (
                          <button
                            onClick={() => handleQuickAction(row.ip_address, 'block')}
                            className="px-2 py-1 rounded bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 text-[11px] font-bold transition"
                          >
                            Block
                          </button>
                        ) : (
                          <button
                            onClick={() => handleQuickAction(row.ip_address, 'unblock')}
                            className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-[11px] font-bold transition"
                          >
                            Unblock
                          </button>
                        )}

                        {row.status !== 'whitelisted' && (
                          <button
                            onClick={() => handleQuickAction(row.ip_address, 'whitelist')}
                            className="px-2 py-1 rounded bg-blue-950/80 hover:bg-blue-900 border border-blue-800 text-blue-300 text-[11px] font-bold transition"
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

