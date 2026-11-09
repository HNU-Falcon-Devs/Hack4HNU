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
      case 'Critical': return 'bg-rose-50 text-rose-700 border-rose-300 font-bold';
      case 'High': return 'bg-orange-50 text-orange-700 border-orange-300 font-bold';
      case 'Medium': return 'bg-amber-50 text-amber-700 border-amber-300';
      default: return 'bg-emerald-50 text-[#006633] border-emerald-300';
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white border border-slate-200 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden my-6 max-h-[90vh] flex flex-col">
        
        {/* Top stripe */}
        <div className="h-1 bg-[#006633] w-full" />
        <div className="h-0.5 bg-[#eab308] w-full" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center space-x-3">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-900 font-mono">SOC Deep IP Investigation</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-white border border-slate-300 text-[#006633]">
                  {ip}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">Security Operations Center Forensic Profile</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200 transition-colors">
            ✕
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 font-sans">
          
          {loading ? (
            <div className="text-center py-12 text-slate-500 font-mono text-sm">
              Analyzing IP telemetry and attack timeline...
            </div>
          ) : (
            <>
              {/* Profile Overview Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-xs text-slate-500 font-mono">Status</div>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-mono uppercase font-bold border ${getStatusBadge(profile.status)}`}>
                    {profile.status}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-xs text-slate-500 font-mono">Threat Level</div>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-mono uppercase font-bold border ${getThreatBadge(profile.threat_level)}`}>
                    {profile.threat_level}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-xs text-slate-500 font-mono">Failed Submissions</div>
                  <div className="text-lg font-bold font-mono text-rose-600 mt-0.5">
                    {profile.failed_attempts_count || history.filter(h => !h.is_correct).length}
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-xs text-slate-500 font-mono">Enforcement</div>
                  <div className="text-xs font-mono font-bold mt-1 text-slate-900">
                    {profile.is_enforced ? (
                      <span className="text-[#006633]">Enforced by Backend</span>
                    ) : (
                      <span className="text-amber-700">Marked Only</span>
                    )}
                  </div>
                </div>
              </div>

              {profile.reason && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs font-mono text-amber-800">
                  <span className="text-amber-900 font-bold uppercase">Trigger Reason: </span>
                  {profile.reason}
                </div>
              )}

              {/* Action Controls & Notes */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <h3 className="text-xs uppercase font-mono tracking-wider text-slate-700 font-semibold">
                  Administrator IP Remediation Actions
                </h3>
                
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Administrative justification note (optional)..."
                    className="w-full sm:flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 placeholder-slate-400 focus:border-[#006633] focus:outline-none"
                  />
                  
                  <div className="flex items-center space-x-2 w-full sm:w-auto shrink-0">
                    <button
                      onClick={() => handleIpAction('block')}
                      disabled={actionLoading}
                      className="px-3 py-2 rounded-lg text-xs font-bold font-mono bg-rose-600 hover:bg-rose-700 text-white flex items-center space-x-1.5 transition-colors disabled:opacity-50 shadow-sm"
                    >
                      <span>Block IP</span>
                    </button>

                    <button
                      onClick={() => handleIpAction('unblock')}
                      disabled={actionLoading}
                      className="px-3 py-2 rounded-lg text-xs font-bold font-mono bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center space-x-1.5 transition-colors disabled:opacity-50"
                    >
                      <span>Reset / Unblock</span>
                    </button>

                    <button
                      onClick={() => handleIpAction('whitelist')}
                      disabled={actionLoading}
                      className="px-3 py-2 rounded-lg text-xs font-bold font-mono bg-[#006633] hover:bg-[#004d26] text-white flex items-center space-x-1.5 transition-colors disabled:opacity-50 shadow-sm"
                    >
                      <span>Whitelist</span>
                    </button>
                  </div>
                </div>

                {actionMessage && (
                  <p className={`text-xs font-mono ${actionMessage.type === 'success' ? 'text-[#006633]' : 'text-rose-600'}`}>
                    {actionMessage.text}
                  </p>
                )}
              </div>

              {/* Complete Submission History */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs uppercase font-mono tracking-wider text-slate-700 font-semibold flex items-center space-x-2">
                    <span>Complete Flag Submission Audit ({history.length} records)</span>
                  </h3>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto max-h-56">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 sticky top-0">
                        <tr>
                          <th className="px-3 py-2">Timestamp</th>
                          <th className="px-3 py-2">Participant</th>
                          <th className="px-3 py-2">Target Challenge</th>
                          <th className="px-3 py-2">Outcome</th>
                          <th className="px-3 py-2">Submitted Guess</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {history.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="px-3 py-6 text-center text-slate-500">
                              No submission activity recorded from this IP yet.
                            </td>
                          </tr>
                        ) : (
                          history.map((sub, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                              <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{sub.submitted_at}</td>
                              <td className="px-3 py-2 text-slate-900 font-medium">{sub.username || 'Anonymous'}</td>
                              <td className="px-3 py-2 text-[#006633] font-bold">{sub.challenge_title || 'Unknown'}</td>
                              <td className="px-3 py-2 whitespace-nowrap">
                                {sub.is_correct ? (
                                  <span className="text-[#006633] font-bold">SUCCESS (+{sub.points_awarded} pts)</span>
                                ) : (
                                  <span className="text-rose-600 font-bold">FAILED</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-slate-600 truncate max-w-xs select-all">
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
                  <h3 className="text-xs uppercase font-mono tracking-wider text-slate-700 font-semibold">
                    Past Administrator Actions on this IP
                  </h3>
                  <div className="bg-white border border-slate-200 rounded-xl p-3 text-xs font-mono space-y-1">
                    {adminActs.map((act, i) => (
                      <div key={i} className="flex items-center justify-between text-slate-700">
                        <span>
                          <strong className="text-[#006633]">{act.admin_username}</strong>: Action '{act.action}'
                          {act.notes && <span className="text-slate-500"> ({act.notes})</span>}
                        </span>
                        <span className="text-slate-400 text-[10px]">{act.created_at}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-mono font-semibold transition-colors"
          >
            Close Forensic View
          </button>
        </div>

      </div>
    </div>
  );
}

