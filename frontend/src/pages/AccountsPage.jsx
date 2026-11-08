import React, { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api';

export default function AccountsPage() {
  const [teams, setTeams] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  // Hidden/revealed passwords on page: map of { [userId]: boolean }
  const [revealedPasswords, setRevealedPasswords] = useState({});

  // Create team form
  const [teamName, setTeamName] = useState('');
  const [members, setMembers] = useState([
    { username: '', password: '' },
    { username: '', password: '' },
    { username: '', password: '' },
    { username: '', password: '' },
  ]);
  const [showFormPasswords, setShowFormPasswords] = useState([false, false, false, false]);

  // Add admin form
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);

  useEffect(() => { loadAccounts(); }, []);

  const loadAccounts = async () => {
    setLoading(true);
    const res = await api.getAccounts();
    if (res.status === 'success' && res.teams) {
      setTeams(res.teams);
      setAdmins(res.admins || []);
    } else {
      // Demo fallback with stored default passwords
      setTeams([
        {
          team_name: 'Team Alpha', team_id: 1,
          members: [
            { id: 2, username: 'cyberspartan', role: 'participant', created_at: '2026-11-01', plain_password: 'Participant123!' },
            { id: 3, username: 'alpha_hunter', role: 'participant', created_at: '2026-11-01', plain_password: 'Participant123!' },
            { id: 4, username: 'alpha_sentry', role: 'participant', created_at: '2026-11-01', plain_password: 'Participant123!' },
            { id: 5, username: 'alpha_vanguard', role: 'participant', created_at: '2026-11-01', plain_password: 'Participant123!' },
          ]
        },
        {
          team_name: 'Team Bravo', team_id: 2,
          members: [
            { id: 6, username: 'bravo_falcon', role: 'participant', created_at: '2026-11-01', plain_password: 'Participant123!' },
            { id: 7, username: 'bravo_shadow', role: 'participant', created_at: '2026-11-01', plain_password: 'Participant123!' },
            { id: 8, username: 'bravo_cipher', role: 'participant', created_at: '2026-11-01', plain_password: 'Participant123!' },
            { id: 9, username: 'bravo_specter', role: 'participant', created_at: '2026-11-01', plain_password: 'Participant123!' },
          ]
        }
      ]);
      setAdmins([
        { id: 1, username: 'admin', role: 'admin', created_at: '2026-11-01', plain_password: 'Admin@HNU2026!' }
      ]);
    }
    setLoading(false);
  };

  const toggleRevealPassword = (userId) => {
    setRevealedPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!teamName.trim()) {
      setMessage({ type: 'error', text: 'Team name is required.' });
      return;
    }

    const m1 = members[0];
    const m2 = members[1];
    const m3 = members[2];
    const m4 = members[3];

    // Members 1, 2, and 3 are required
    if (!m1.username.trim() || !m1.password.trim()) {
      setMessage({ type: 'error', text: 'Member 1: username and password are required.' });
      return;
    }
    if (!m2.username.trim() || !m2.password.trim()) {
      setMessage({ type: 'error', text: 'Member 2: username and password are required.' });
      return;
    }
    if (!m3.username.trim() || !m3.password.trim()) {
      setMessage({ type: 'error', text: 'Member 3: username and password are required.' });
      return;
    }

    // Member 4 is optional: if either field is touched, both must be provided
    if ((m4.username.trim() && !m4.password.trim()) || (!m4.username.trim() && m4.password.trim())) {
      setMessage({ type: 'error', text: 'Member 4 (Optional): provide both username and password, or leave both empty.' });
      return;
    }

    const filledMembers = members.filter(m => m.username.trim() && m.password.trim());

    setSubmitting(true);
    const res = await api.createTeam({ team_name: teamName.trim(), members: filledMembers });
    setSubmitting(false);

    if (res.status === 'success') {
      setMessage({ type: 'success', text: `Team "${teamName}" created with ${filledMembers.length} participants!` });
      setTeamName('');
      setMembers([
        { username: '', password: '' },
        { username: '', password: '' },
        { username: '', password: '' },
        { username: '', password: '' }
      ]);
      setShowCreateTeam(false);
      loadAccounts();
    } else {
      setMessage({ type: 'error', text: res.message || 'Failed to create team.' });
    }
    setTimeout(() => setMessage(null), 5000);
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!adminUsername.trim() || !adminPassword.trim()) return;
    setSubmitting(true);
    const res = await api.createAccount({ username: adminUsername.trim(), password: adminPassword, role: 'admin' });
    setSubmitting(false);
    if (res.status === 'success') {
      setMessage({ type: 'success', text: `Admin account "${adminUsername}" created.` });
      setAdminUsername('');
      setAdminPassword('');
      setShowAddAdmin(false);
      loadAccounts();
    } else {
      setMessage({ type: 'error', text: res.message || 'Failed to create admin account.' });
    }
    setTimeout(() => setMessage(null), 5000);
  };

  const handleDeleteUser = async (userId, username) => {
    if (!confirm(`Remove member "${username}"? This cannot be undone.`)) return;
    const res = await api.deleteAccount(userId);
    if (res.status === 'success') {
      setMessage({ type: 'success', text: `Member "${username}" removed.` });
      loadAccounts();
    } else {
      setMessage({ type: 'error', text: res.message || 'Failed to remove member.' });
    }
    setTimeout(() => setMessage(null), 4000);
  };

  const handleDeleteTeam = async (teamId, teamName) => {
    if (!confirm(`Are you sure you want to remove team "${teamName}" and all its members? This cannot be undone.`)) return;
    const res = await api.deleteTeam(teamId);
    if (res.status === 'success') {
      setMessage({ type: 'success', text: `Team "${teamName}" removed successfully.` });
      loadAccounts();
    } else {
      setMessage({ type: 'error', text: res.message || 'Failed to remove team.' });
    }
    setTimeout(() => setMessage(null), 4000);
  };

  const handleSuspendTeam = async (teamId, teamName) => {
    if (!confirm(`Suspend team "${teamName}" for 30 minutes? Their screens will immediately blur with the rule violation notice.`)) return;
    const res = await api.suspendTeam(teamId, 30, "You're suspended for 30mins.... your doing something not in the rules");
    if (res.status === 'success') {
      setMessage({ type: 'success', text: `Team "${teamName}" has been suspended for 30 minutes.` });
      loadAccounts();
    } else {
      setMessage({ type: 'error', text: res.message || 'Failed to suspend team.' });
    }
    setTimeout(() => setMessage(null), 4000);
  };

  const handleUnsuspendTeam = async (teamId, teamName) => {
    const res = await api.unsuspendTeam(teamId);
    if (res.status === 'success') {
      setMessage({ type: 'success', text: `Suspension lifted for team "${teamName}".` });
      loadAccounts();
    } else {
      setMessage({ type: 'error', text: res.message || 'Failed to lift suspension.' });
    }
    setTimeout(() => setMessage(null), 4000);
  };

  const handleSuspendUser = async (userId, username) => {
    if (!confirm(`Suspend "${username}" for 30 minutes? Their screen will immediately blur with the rule violation notice.`)) return;
    const res = await api.suspendUser(userId, 30, "You're suspended for 30mins.... your doing something not in the rules");
    if (res.status === 'success') {
      setMessage({ type: 'success', text: `Participant "${username}" suspended for 30 minutes.` });
      loadAccounts();
    } else {
      setMessage({ type: 'error', text: res.message || 'Failed to suspend participant.' });
    }
    setTimeout(() => setMessage(null), 4000);
  };

  const handleUnsuspendUser = async (userId, username) => {
    const res = await api.unsuspendUser(userId);
    if (res.status === 'success') {
      setMessage({ type: 'success', text: `Suspension lifted for "${username}".` });
      loadAccounts();
    } else {
      setMessage({ type: 'error', text: res.message || 'Failed to lift suspension.' });
    }
    setTimeout(() => setMessage(null), 4000);
  };

  const toggleShowFormPassword = (i) => {
    setShowFormPasswords(prev => {
      const n = [...prev];
      n[i] = !n[i];
      return n;
    });
  };

  const updateMember = (i, field, val) => {
    setMembers(prev => {
      const n = [...prev];
      n[i] = { ...n[i], [field]: val };
      return n;
    });
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-[#1a2234] border border-[#26334a] rounded-2xl p-6 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight font-mono">Account Management</h1>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={loadAccounts}
            disabled={loading}
            className="px-3.5 py-2 bg-[#121722] hover:bg-[#202b3d] border border-[#26334a] text-gray-300 rounded-xl text-xs font-mono flex items-center space-x-1.5 transition"
          >
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowAddAdmin(true)}
            className="px-4 py-2 bg-[#121722] hover:bg-[#202b3d] border border-amber-700/60 text-amber-300 rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 transition"
          >
            <span>Add Admin</span>
          </button>
          <button
            onClick={() => setShowCreateTeam(true)}
            className="px-4 py-2 bg-gradient-to-r from-[#059669] to-[#10B981] hover:from-[#047857] hover:to-[#059669] text-white rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 transition shadow-md shadow-emerald-900/30"
          >
            <span>Create Team</span>
          </button>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`p-4 rounded-xl border text-sm font-mono ${message.type === 'success'
          ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300'
          : 'bg-red-950/60 border-red-700/60 text-red-300'
          }`}>
          <span>{message.text}</span>
        </div>
      )}

      {/* Teams & Members Section */}
      {loading ? (
        <div className="bg-[#1a2234] border border-[#26334a] rounded-2xl p-12 text-center text-gray-400 font-mono text-sm">
          Loading accounts...
        </div>
      ) : teams.length === 0 ? (
        <div className="bg-[#1a2234] border border-[#26334a] rounded-2xl p-12 text-center text-gray-500 font-mono text-sm">
          No teams created yet. Click "Create Team" to add one.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Participant Teams ({teams.length})
            </h2>
          </div>

          {teams.map((team) => (
            <div key={team.team_id || team.team_name} className="bg-[#1a2234] border border-[#26334a] rounded-2xl overflow-hidden shadow-md">
              {/* Team header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3.5 bg-[#161c2d] border-b border-[#26334a] gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#059669] to-[#10B981] flex items-center justify-center font-black text-xs text-white">
                    {(team.team_name || 'T').charAt(0)}
                  </div>
                  <span className="font-bold text-white text-sm">{team.team_name}</span>
                  <span className="text-xs font-mono text-gray-400">
                    {(team.members || []).length} / 4 members
                  </span>
                  {team.is_suspended && (
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-rose-950/90 border border-rose-600 text-rose-300 font-bold uppercase tracking-wider animate-pulse">
                      Suspended ({Math.ceil((team.suspension_remaining || 1800) / 60)}m remaining)
                    </span>
                  )}
                  {(team.members || []).length === 3 && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-950/60 border border-amber-700/50 text-amber-300">
                      3 of 4 slots filled
                    </span>
                  )}
                </div>

                {/* Team Actions: Suspend / Unsuspend & Remove Team */}
                <div className="flex items-center space-x-2 shrink-0">
                  {team.is_suspended ? (
                    <button
                      onClick={() => handleUnsuspendTeam(team.team_id, team.team_name)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600 text-emerald-300 text-xs font-mono font-bold transition shadow-sm"
                    >
                      Unsuspend Team
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSuspendTeam(team.team_id, team.team_name)}
                      className="px-2.5 py-1 rounded-lg bg-amber-950/70 hover:bg-amber-900 border border-amber-700/80 text-amber-300 text-xs font-mono font-bold transition shadow-sm"
                      title="Suspend entire team for 30 minutes"
                    >
                      Suspend Team (30m)
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteTeam(team.team_id, team.team_name)}
                    className="px-2.5 py-1 rounded-lg bg-red-950/70 hover:bg-red-900 border border-red-700 text-red-300 text-xs font-mono font-bold transition shadow-sm"
                    title="Remove team and all its participants"
                  >
                    Remove Team
                  </button>
                </div>
              </div>

              {/* Members table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#121722] text-gray-500 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-5 py-2.5">#</th>
                      <th className="px-5 py-2.5">Username</th>
                      <th className="px-5 py-2.5">Password</th>
                      <th className="px-5 py-2.5">Role / Status</th>
                      <th className="px-5 py-2.5">Created</th>
                      <th className="px-5 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#26334a]/60">
                    {(team.members || []).map((m, mi) => {
                      const isRevealed = !!revealedPasswords[m.id];
                      return (
                        <tr key={m.id || mi} className="hover:bg-[#202b3d] transition">
                          <td className="px-5 py-3 text-gray-500 font-bold">{mi + 1}</td>
                          <td className="px-5 py-3 font-bold text-white">{m.username}</td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-xs select-all text-gray-300 min-w-[90px]">
                                {isRevealed ? (m.plain_password || 'Participant123!') : '••••••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleRevealPassword(m.id)}
                                className="text-gray-400 hover:text-emerald-400 p-1 rounded transition"
                                title={isRevealed ? 'Hide password' : 'View password'}
                              >
                                {isRevealed ? <EyeOff className="w-3.5 h-3.5 text-emerald-400" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 border border-emerald-700/50 text-emerald-300 mr-1.5">
                              {m.role || 'participant'}
                            </span>
                            {m.is_suspended && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-950 border border-rose-700 text-rose-300 uppercase tracking-wider animate-pulse">
                                Suspended ({Math.ceil((m.suspension_remaining || 1800) / 60)}m)
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-gray-400">{m.created_at || '—'}</td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              {/* Suspend / Unsuspend Participant */}
                              {m.is_suspended ? (
                                <button
                                  onClick={() => handleUnsuspendUser(m.id, m.username)}
                                  className="px-2 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600 text-emerald-300 text-[10px] font-mono font-bold transition"
                                  title="Lift 30m suspension"
                                >
                                  Unsuspend
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleSuspendUser(m.id, m.username)}
                                  className="px-2 py-1 rounded-lg bg-amber-950/60 hover:bg-amber-900 border border-amber-700 text-amber-300 text-[10px] font-mono font-bold transition"
                                  title="Suspend for 30 minutes"
                                >
                                  Suspend (30m)
                                </button>
                              )}

                              {/* Remove Member */}
                              <button
                                onClick={() => handleDeleteUser(m.id, m.username)}
                                className="px-2 py-1 rounded-lg bg-red-950/60 hover:bg-red-900/80 border border-red-800/60 text-red-300 text-[10px] font-mono font-bold transition"
                                title="Remove member"
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {/* Empty slots */}
                    {Array.from({ length: Math.max(0, 4 - (team.members || []).length) }).map((_, ei) => {
                      const slotNumber = (team.members || []).length + ei + 1;
                      return (
                        <tr key={`empty-${ei}`} className="opacity-40">
                          <td className="px-5 py-3 text-gray-600">{slotNumber}</td>
                          <td className="px-5 py-3 text-gray-600 italic">
                            Empty slot {slotNumber === 4 ? '(4th member optional)' : ''}
                          </td>
                          <td className="px-5 py-3">—</td>
                          <td className="px-5 py-3">—</td>
                          <td className="px-5 py-3">—</td>
                          <td className="px-5 py-3"></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {/* Administrators Section */}
          {admins.length > 0 && (
            <div className="space-y-4 pt-4">
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Administrators ({admins.length})
              </h2>
              <div className="bg-[#1a2234] border border-[#26334a] rounded-2xl overflow-hidden shadow-md">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#121722] text-gray-500 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-5 py-2.5">#</th>
                        <th className="px-5 py-2.5">Username</th>
                        <th className="px-5 py-2.5">Password</th>
                        <th className="px-5 py-2.5">Role</th>
                        <th className="px-5 py-2.5">Created</th>
                        <th className="px-5 py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#26334a]/60">
                      {admins.map((adm, ai) => {
                        const isRevealed = !!revealedPasswords[adm.id];
                        return (
                          <tr key={adm.id || ai} className="hover:bg-[#202b3d] transition">
                            <td className="px-5 py-3 text-gray-500 font-bold">{ai + 1}</td>
                            <td className="px-5 py-3 font-bold text-amber-300">{adm.username}</td>
                            <td className="px-5 py-3 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <span className="font-mono text-xs select-all text-gray-300 min-w-[90px]">
                                  {isRevealed ? (adm.plain_password || 'Admin@HNU2026!') : '••••••••••••'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => toggleRevealPassword(adm.id)}
                                  className="text-gray-400 hover:text-amber-400 p-1 rounded transition"
                                  title={isRevealed ? 'Hide password' : 'View password'}
                                >
                                  {isRevealed ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </td>
                            <td className="px-5 py-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/60 border border-amber-700/50 text-amber-300 uppercase">
                                Administrator
                              </span>
                            </td>
                            <td className="px-5 py-3 text-gray-400">{adm.created_at || '—'}</td>
                            <td className="px-5 py-3 text-right">
                              {adm.username !== 'admin' && (
                                <button
                                  onClick={() => handleDeleteUser(adm.id, adm.username)}
                                  className="px-2.5 py-1 rounded-lg bg-red-950/60 hover:bg-red-900/80 border border-red-800/60 text-red-300 text-[11px] font-bold transition"
                                >
                                  <span>Delete</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ Create Team Modal ══════════════════════════════════════════════ */}
      {showCreateTeam && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1a2234] border border-[#26334a] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white font-mono">Create New Team</h3>
                <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                  Members 1, 2, and 3 are required. Member 4 is optional.
                </p>
              </div>
              <button onClick={() => setShowCreateTeam(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateTeam} className="space-y-4 font-mono text-xs">
              {/* Team Name */}
              <div>
                <label className="block text-gray-400 mb-1 uppercase tracking-wider text-[10px]">Team Name</label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. Team Gamma"
                  required
                  className="w-full bg-[#121722] border border-[#26334a] rounded-xl p-2.5 text-white focus:border-emerald-400 focus:outline-none"
                />
              </div>

              {/* 4 Member Slots */}
              <div>
                <label className="block text-gray-400 mb-2 uppercase tracking-wider text-[10px]">
                  Team Participants (Slots 1–3 Required, Slot 4 Optional)
                </label>
                <div className="space-y-2.5">
                  {members.map((m, i) => {
                    const isOptional = i === 3;
                    return (
                      <div
                        key={i}
                        className={`border rounded-xl p-3 space-y-2 ${isOptional
                          ? 'bg-[#121722]/80 border-dashed border-amber-800/60'
                          : 'bg-[#121722] border-[#26334a]'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] uppercase font-bold ${isOptional ? 'text-amber-400' : 'text-emerald-400'
                            }`}>
                            Member {i + 1} {isOptional ? '(Optional)' : '(Required)'}
                          </span>
                          {isOptional && (
                            <span className="text-[10px] text-gray-500 italic">
                              Can leave blank
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={m.username}
                            onChange={(e) => updateMember(i, 'username', e.target.value)}
                            placeholder={isOptional ? 'Username (optional)' : 'Username (required)'}
                            required={!isOptional}
                            className="bg-[#1a2234] border border-[#26334a] rounded-lg p-2 text-white focus:border-emerald-400 focus:outline-none"
                          />
                          <div className="relative">
                            <input
                              type={showFormPasswords[i] ? 'text' : 'password'}
                              value={m.password}
                              onChange={(e) => updateMember(i, 'password', e.target.value)}
                              placeholder={isOptional ? 'Password (optional)' : 'Password (required)'}
                              required={!isOptional}
                              className="w-full bg-[#1a2234] border border-[#26334a] rounded-lg p-2 pr-8 text-white focus:border-emerald-400 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => toggleShowFormPassword(i)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
                              title={showFormPasswords[i] ? 'Hide' : 'Show'}
                            >
                              {showFormPasswords[i] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-gray-500 mt-2">
                  Tip: A team can compete with 3 or 4 participants. Passwords are saved and can be viewed anytime by administrators in the accounts table.
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#26334a]">
                <button
                  type="button"
                  onClick={() => setShowCreateTeam(false)}
                  className="px-4 py-2 bg-[#121722] hover:bg-[#202b3d] text-gray-300 border border-[#26334a] rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-gradient-to-r from-[#059669] to-[#10B981] hover:from-[#047857] hover:to-[#059669] text-white font-bold rounded-xl transition disabled:opacity-50 flex items-center space-x-1.5"
                >
                  <span>{submitting ? 'Creating...' : 'Create Team'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ Add Admin Modal ══════════════════════════════════════════════ */}
      {showAddAdmin && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1a2234] border border-[#26334a] rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white font-mono flex items-center space-x-2">
                <span>Add Administrator</span>
              </h3>
              <button onClick={() => setShowAddAdmin(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleAddAdmin} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-gray-400 mb-1">Admin Username</label>
                <input
                  type="text"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  required
                  placeholder="admin_username"
                  className="w-full bg-[#121722] border border-[#26334a] rounded-xl p-2.5 text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showAdminPass ? 'text' : 'password'}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    placeholder="Strong password"
                    className="w-full bg-[#121722] border border-[#26334a] rounded-xl p-2.5 pr-9 text-white focus:border-amber-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPass(p => !p)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
                    title={showAdminPass ? 'Hide' : 'Show'}
                  >
                    {showAdminPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-2 border-t border-[#26334a]">
                <button
                  type="button"
                  onClick={() => setShowAddAdmin(false)}
                  className="px-4 py-2 bg-[#121722] hover:bg-[#202b3d] text-gray-300 border border-[#26334a] rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold rounded-xl transition disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
