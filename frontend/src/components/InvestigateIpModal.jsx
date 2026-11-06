import React, { useEffect, useState } from 'react';
import { 
  X, ShieldAlert, ShieldCheck, Ban, CheckCircle2, History, AlertTriangle, 
  Terminal, User, Clock, FileWarning, ArrowUpRight
} from 'lucide-react';
import { api } from '../services/api';

export default function InvestigateIpModal({ ip, onClose, onActionSuccess }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  useEffect(() => {
    if (!ip) return;
    loadIpDetails();
  }, [ip]);

  const loadIpDetails = async () => {
    setLoading(true);
    const res = await api.investigateIp(ip);
    setData(res);
    setLoading(false);
  };

  const handleIpAction = async (action) => {
    setActionLoading(true);
    setActionMessage(null);

    const res = await api.manageIp(action, {
      ip_address: ip,
      notes: notes.trim(),
      is_enforced: 1
    });

    setActionLoading(false);
    if (res.status === 'success') {
      setActionMessage({ type: 'success', text: res.message });
      setNotes('');
      loadIpDetails();
      if (onActionSuccess) onActionSuccess();
    } else {
      setActionMessage({ type: 'error', text: res.message || 'Action failed' });
    }
  };

  if (!ip) return null;

  const profile = data?.profile || {};
  const history = data?.submission_history || [];
  const secEvents = data?.security_events || [];
  const adminActs = data?.admin_actions || [];

  const getThreatBadge = (level) => {
    switch (level) {
      case 'Critical': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'High': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'Medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
      default: return 'bg-green-500/20 text-green-400 border-green-500/50';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'blocked': return 'bg-red-950 text-red-400 border-red-800';
      case 'rate_limited': return 'bg-amber-950 text-amber-400 border-amber-800';
      case 'suspicious': return 'bg-orange-950 text-orange-400 border-orange-800';
      case 'whitelisted': return 'bg-blue-950 text-blue-400 border-blue-800';
      default: return 'bg-gray-800 text-gray-300 border-gray-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative bg-[#111827] border border-[#1E293B] rounded-xl max-w-4xl w-full shadow-2xl overflow-hidden my-6 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E293B] bg-[#0B1120] shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-950/80 border border-red-800/80 rounded-lg text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white font-mono">SOC Deep IP Investigation</h2>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#1E293B] text-cyan-300">
                  {ip}
                </span>
              </div>
              <p className="text-xs text-gray-400 font-mono">Security Operations Center Forensic Profile</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 font-sans">
          
          {loading ? (
            <div className="text-center py-12 text-gray-400 font-mono text-sm">
              Analyzing IP telemetry and attack timeline...
            </div>
          ) : (
            <>
              {/* Profile Overview Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#080D18] p-3 rounded-lg border border-gray-800">
                  <div className="text-xs text-gray-400 font-mono">Status</div>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-mono uppercase font-bold border ${getStatusBadge(profile.status)}`}>
                    {profile.status}
                  </span>
                </div>
                <div className="bg-[#080D18] p-3 rounded-lg border border-gray-800">
                  <div className="text-xs text-gray-400 font-mono">Threat Level</div>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-mono uppercase font-bold border ${getThreatBadge(profile.threat_level)}`}>
                    {profile.threat_level}
                  </span>
                </div>
                <div className="bg-[#080D18] p-3 rounded-lg border border-gray-800">
                  <div className="text-xs text-gray-400 font-mono">Failed Submissions</div>
                  <div className="text-lg font-bold font-mono text-red-400 mt-0.5">
                    {profile.failed_attempts_count || history.filter(h => !h.is_correct).length}
                  </div>
                </div>
                <div className="bg-[#080D18] p-3 rounded-lg border border-gray-800">
                  <div className="text-xs text-gray-400 font-mono">Enforcement</div>
                  <div className="text-xs font-mono font-bold mt-1 text-white">
                    {profile.is_enforced ? (
                      <span className="text-green-400">Enforced by Backend</span>
                    ) : (
                      <span className="text-amber-400">Marked Only</span>
                    )}
                  </div>
                </div>
              </div>

              {profile.reason && (
                <div className="bg-[#0D1527] border border-cyan-900/60 rounded-lg p-3 text-xs font-mono text-cyan-200">
                  <span className="text-cyan-400 font-bold uppercase">Trigger Reason: </span>
                  {profile.reason}
                </div>
              )}

              {/* Action Controls & Notes */}
              <div className="bg-[#0B1120] border border-gray-800 rounded-lg p-4 space-y-3">
                <h3 className="text-xs uppercase font-mono tracking-wider text-gray-300 font-semibold">
                  Administrator IP Remediation Actions
                </h3>
                
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Administrative justification note (optional)..."
                    className="w-full sm:flex-1 bg-[#080D18] border border-gray-700 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-gray-500 focus:border-cyan-400"
                  />
                  
                  <div className="flex items-center space-x-2 w-full sm:w-auto shrink-0">
                    <button
                      onClick={() => handleIpAction('block')}
                      disabled={actionLoading}
                      className="px-3 py-2 rounded-lg text-xs font-bold font-mono bg-red-600 hover:bg-red-500 text-white flex items-center space-x-1.5 transition disabled:opacity-50"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Block IP</span>
                    </button>

                    <button
                      onClick={() => handleIpAction('unblock')}
                      disabled={actionLoading}
                      className="px-3 py-2 rounded-lg text-xs font-bold font-mono bg-gray-700 hover:bg-gray-600 text-white flex items-center space-x-1.5 transition disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                      <span>Reset / Unblock</span>
                    </button>

                    <button
                      onClick={() => handleIpAction('whitelist')}
                      disabled={actionLoading}
                      className="px-3 py-2 rounded-lg text-xs font-bold font-mono bg-blue-600 hover:bg-blue-500 text-white flex items-center space-x-1.5 transition disabled:opacity-50"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-200" />
                      <span>Whitelist</span>
                    </button>
                  </div>
                </div>

                {actionMessage && (
                  <p className={`text-xs font-mono ${actionMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                    {actionMessage.text}
                  </p>
                )}
              </div>

              {/* Complete Submission History */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs uppercase font-mono tracking-wider text-gray-300 font-semibold flex items-center space-x-2">
                    <History className="w-4 h-4 text-cyan-400" />
                    <span>Complete Flag Submission Audit ({history.length} records)</span>
                  </h3>
                </div>

                <div className="bg-[#080D18] border border-gray-800 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto max-h-56">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-[#0E1626] text-gray-400 border-b border-gray-800 sticky top-0">
                        <tr>
                          <th className="px-3 py-2">Timestamp</th>
                          <th className="px-3 py-2">Participant</th>
                          <th className="px-3 py-2">Target Challenge</th>
                          <th className="px-3 py-2">Outcome</th>
                          <th className="px-3 py-2">Submitted Guess</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/60">
                        {history.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="px-3 py-6 text-center text-gray-500">
                              No submission activity recorded from this IP yet.
                            </td>
                          </tr>
                        ) : (
                          history.map((sub, idx) => (
                            <tr key={idx} className="hover:bg-gray-800/30">
                              <td className="px-3 py-2 text-gray-400 whitespace-nowrap">{sub.submitted_at}</td>
                              <td className="px-3 py-2 text-white font-medium">{sub.username || 'Anonymous'}</td>
                              <td className="px-3 py-2 text-cyan-300">{sub.challenge_title || 'Unknown'}</td>
                              <td className="px-3 py-2 whitespace-nowrap">
                                {sub.is_correct ? (
                                  <span className="text-green-400 font-bold">SUCCESS (+{sub.points_awarded} pts)</span>
                                ) : (
                                  <span className="text-red-400 font-bold">FAILED</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-gray-400 truncate max-w-xs select-all">
                                {sub.submitted_flag}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Administrator Action Trail */}
              {adminActs.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs uppercase font-mono tracking-wider text-gray-300 font-semibold">
                    Past Administrator Actions on this IP
                  </h3>
                  <div className="bg-[#080D18] border border-gray-800 rounded-lg p-3 text-xs font-mono space-y-1">
                    {adminActs.map((act, i) => (
                      <div key={i} className="flex items-center justify-between text-gray-300">
                        <span>
                          <strong className="text-cyan-400">{act.admin_username}</strong>: Action '{act.action}'
                          {act.notes && <span className="text-gray-400"> ({act.notes})</span>}
                        </span>
                        <span className="text-gray-500 text-[10px]">{act.created_at}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#1E293B] bg-[#0B1120] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-mono font-semibold transition"
          >
            Close Forensic View
          </button>
        </div>

      </div>
    </div>
  );
}

