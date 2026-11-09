import React, { useEffect, useState } from 'react';
import {
  Flag, Edit3, Eye, EyeOff, CheckCircle, Power, Users, Plus,
  Search, Download, ExternalLink, ShieldCheck, RefreshCw, X, Trash2
} from 'lucide-react';
import { api } from '../services/api';

const CATEGORIES = ['Web', 'OSINT', 'Network', 'Forensics', 'Steganography', 'Miscellaneous'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

const BLANK_CHALLENGE = {
  title: '', category: 'Web', difficulty: 'Easy', points: 100,
  correct_flag: '', description: '', target_info: '', is_enabled: true
};

export default function ChallengeManagementPage() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editChallenge, setEditChallenge] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChallenge, setNewChallenge] = useState({ ...BLANK_CHALLENGE });
  const [creating, setCreating] = useState(false);
  const [showSolversModal, setShowSolversModal] = useState(null);
  const [solversList, setSolversList] = useState([]);
  const [solversLoading, setSolversLoading] = useState(false);
  const [revealFlags, setRevealFlags] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    setLoading(true);
    const res = await api.getChallenges();
    if (res.status === 'success' && res.challenges) {
      setChallenges(res.challenges);
    }
    setLoading(false);
  };

  const handleToggle = async (id) => {
    await api.toggleChallenge(id);
    loadChallenges();
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editChallenge) return;

    setSaving(true);
    const res = await api.updateChallenge(editChallenge);
    setSaving(false);

    if (res.status === 'success') {
      setEditChallenge(null);
      loadChallenges();
    } else {
      alert(res.message || 'Failed to update challenge');
    }
  };

  const openSolversModal = async (ch) => {
    setShowSolversModal(ch);
    setSolversLoading(true);
    const res = await api.getChallengeSolvers(ch.id);
    if (res.status === 'success' && res.solvers) {
      setSolversList(res.solvers);
    }
    setSolversLoading(false);
  };

  const handleCreateChallenge = async (e) => {
    e.preventDefault();
    setCreating(true);
    const res = await api.createChallenge(newChallenge);
    setCreating(false);
    if (res.status === 'success') {
      setNewChallenge({ ...BLANK_CHALLENGE });
      setShowCreateModal(false);
      loadChallenges();
    } else {
      alert(res.message || 'Failed to create challenge');
    }
  };

  const handleDeleteChallenge = async (id, title) => {
    if (!confirm(`Delete challenge "${title}"? This cannot be undone.`)) return;
    const res = await api.deleteChallenge(id);
    if (res.status === 'success') {
      loadChallenges();
    } else {
      alert(res.message || 'Failed to delete challenge');
    }
  };

  const toggleFlagReveal = (id) => {
    setRevealFlags(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filtered = challenges.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#006633]" />
        <div className="absolute top-1 left-0 right-0 h-0.5 bg-[#eab308]" />

        <div className="flex items-center space-x-3 pt-1">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight font-mono">
              Challenges Dashboard
            </h1>
            <p className="text-xs text-slate-500 font-mono">Manage challenge definitions, flags, points, and solvers</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadChallenges}
            disabled={loading}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-xl text-xs font-mono flex items-center space-x-1.5 transition-colors"
          >
            <span>Reload</span>
          </button>
          <button
            onClick={() => { setNewChallenge({ ...BLANK_CHALLENGE }); setShowCreateModal(true); }}
            className="px-4 py-2 bg-[#006633] hover:bg-[#004d26] text-white rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 transition-colors shadow-sm"
          >
            <span>Add Challenge</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search challenges by title or category..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-900 placeholder-slate-400 focus:border-[#006633] transition-colors focus:outline-none"
          />
        </div>
        <span className="text-xs text-slate-500 font-mono hidden sm:block">
          Total Imported: {challenges.length}
        </span>
      </div>

      {/* Challenges Admin Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">ID</th>
                <th className="px-5 py-3.5">Title</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Difficulty</th>
                <th className="px-5 py-3.5">Points</th>
                <th className="px-5 py-3.5">Configured Flag Key</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Solves</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-5 py-12 text-center text-slate-400">
                    Loading challenge configurations...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-5 py-12 text-center text-slate-500">
                    No challenges matched your query.
                  </td>
                </tr>
              ) : (
                filtered.map((ch) => {
                  const isRevealed = revealFlags[ch.id];
                  return (
                    <tr key={ch.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 text-slate-400 font-bold">#{ch.id}</td>
                      <td className="px-5 py-3.5 font-bold text-slate-900 whitespace-nowrap">{ch.title}</td>
                      <td className="px-5 py-3.5 text-[#006633] font-bold">{ch.category}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 border border-slate-200 text-slate-700">
                          {ch.difficulty}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-[#eab308]">{ch.points}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-slate-700 select-all font-mono">
                            {isRevealed ? (ch.correct_flag || 'N/A') : '••••••••••••••••••••'}
                          </span>
                          <button
                            onClick={() => toggleFlagReveal(ch.id)}
                            className="text-slate-400 hover:text-[#006633] p-0.5"
                            title={isRevealed ? 'Mask Flag' : 'Reveal Flag'}
                          >
                            {isRevealed ? 'Hide' : 'Show'}
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <button
                          onClick={() => handleToggle(ch.id)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center space-x-1 ${ch.is_enabled
                            ? 'bg-emerald-50 border-emerald-300 text-[#006633]'
                            : 'bg-rose-50 border-rose-300 text-rose-700'
                            }`}
                        >
                          <span>{ch.is_enabled ? 'Active' : 'Disabled'}</span>
                        </button>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <button
                          onClick={() => openSolversModal(ch)}
                          className="text-[#006633] hover:underline flex items-center space-x-1 font-bold"
                        >
                          <span>{ch.solve_count || 0} solvers</span>
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => setEditChallenge({ ...ch })}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded text-[11px] font-bold flex items-center space-x-1 transition-colors"
                          >
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteChallenge(ch.id, ch.title)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 rounded text-[11px] font-bold flex items-center space-x-1 transition-colors"
                          >
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Challenge Modal */}
      {editChallenge && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 font-mono">
                <span>Configure Challenge: {editChallenge.title}</span>
              </h3>
              <button onClick={() => setEditChallenge(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Challenge Title</label>
                  <input
                    type="text"
                    value={editChallenge.title}
                    onChange={(e) => setEditChallenge({ ...editChallenge, title: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 focus:border-[#006633] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Category</label>
                  <select
                    value={editChallenge.category}
                    onChange={(e) => setEditChallenge({ ...editChallenge, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 focus:border-[#006633] focus:outline-none"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Difficulty</label>
                  <select
                    value={editChallenge.difficulty}
                    onChange={(e) => setEditChallenge({ ...editChallenge, difficulty: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 focus:border-[#006633] focus:outline-none"
                  >
                    {DIFFICULTIES.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Point Value</label>
                  <input
                    type="number"
                    min="1"
                    max="5000"
                    value={editChallenge.points}
                    onChange={(e) => setEditChallenge({ ...editChallenge, points: parseInt(e.target.value) || 0 })}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 focus:border-[#006633] focus:outline-none"
                  />
                </div>
              </div>

              {/* Correct Flag Input */}
              <div className="bg-rose-50 p-3 rounded-lg border border-rose-200 space-y-1">
                <label className="block text-rose-700 font-bold uppercase tracking-wider">
                  Correct Flag Key (Format: HNU&#123;...&#125;)
                </label>
                <input
                  type="text"
                  value={editChallenge.correct_flag || ''}
                  onChange={(e) => setEditChallenge({ ...editChallenge, correct_flag: e.target.value })}
                  required
                  placeholder="HNU{your_secret_flag}"
                  className="w-full bg-white border border-rose-300 rounded p-2 text-slate-900 font-bold select-all focus:border-[#006633] focus:outline-none"
                />
                <p className="text-[10px] text-slate-500">
                  Case-sensitive verification. Submissions matching this exact string award points.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Target Host / Connection Info / URL</label>
                <input
                  type="text"
                  value={editChallenge.target_info || ''}
                  onChange={(e) => setEditChallenge({ ...editChallenge, target_info: e.target.value })}
                  placeholder="e.g. 172.16.105.9:3000 or Target IP: 124.6.144.115"
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 focus:border-[#006633] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Description & Prompt Instructions</label>
                <textarea
                  rows={4}
                  value={editChallenge.description}
                  onChange={(e) => setEditChallenge({ ...editChallenge, description: e.target.value })}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 focus:border-[#006633] focus:outline-none font-sans text-xs leading-relaxed"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="enabledCheck"
                  checked={editChallenge.is_enabled}
                  onChange={(e) => setEditChallenge({ ...editChallenge, is_enabled: e.target.checked })}
                  className="rounded bg-slate-50 border-slate-300 text-[#006633] focus:ring-0"
                />
                <label htmlFor="enabledCheck" className="text-slate-700 cursor-pointer">
                  Challenge is active and visible to participants
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditChallenge(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#006633] hover:bg-[#004d26] text-white font-bold rounded transition-colors shadow-sm disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Solvers Inspection Modal */}
      {showSolversModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 font-mono">
                <span>Solvers for: {showSolversModal.title}</span>
              </h3>
              <button onClick={() => setShowSolversModal(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2">
              {solversLoading ? (
                <div className="text-center py-6 text-slate-500">Loading solvers list...</div>
              ) : solversList.length === 0 ? (
                <div className="text-center py-6 text-slate-500">No participants have solved this challenge yet.</div>
              ) : (
                solversList.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-400 font-bold">#{idx + 1}</span>
                      <span className="text-slate-900 font-bold">{s.username}</span>
                    </div>
                    <span className="text-slate-500 text-[10px]">{s.solved_at}</span>
                  </div>
                ))
              )}
            </div>

            <div className="text-right pt-2 border-t border-slate-200">
              <button
                onClick={() => setShowSolversModal(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Create Challenge Modal ══════════════════════════════════════════ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 font-mono">
                <span>Add New Challenge</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleCreateChallenge} className="space-y-3">
              {/* Category first */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-1">
                <label className="block text-[#006633] font-bold uppercase tracking-wider text-[10px]">Category (select first)</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {CATEGORIES.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewChallenge({ ...newChallenge, category: c })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${newChallenge.category === c
                        ? 'bg-[#006633] border-[#006633] text-white shadow-sm'
                        : 'bg-white border-slate-300 text-slate-700 hover:border-[#006633]'
                        }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Challenge Title</label>
                  <input type="text" value={newChallenge.title}
                    onChange={(e) => setNewChallenge({ ...newChallenge, title: e.target.value })}
                    required placeholder="e.g. SQL Injection 101"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:border-[#006633] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Difficulty</label>
                  <select value={newChallenge.difficulty}
                    onChange={(e) => setNewChallenge({ ...newChallenge, difficulty: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:border-[#006633] focus:outline-none">
                    {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Point Value</label>
                <input type="number" min="1" max="5000" value={newChallenge.points}
                  onChange={(e) => setNewChallenge({ ...newChallenge, points: parseInt(e.target.value) || 100 })}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:border-[#006633] focus:outline-none" />
              </div>

              {/* Flag */}
              <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 space-y-1">
                <label className="block text-rose-700 font-bold uppercase tracking-wider text-[10px]">
                  Correct Flag (Format: HNU&#123;...&#125;)
                </label>
                <input type="text" value={newChallenge.correct_flag}
                  onChange={(e) => setNewChallenge({ ...newChallenge, correct_flag: e.target.value })}
                  required placeholder="HNU{your_secret_flag}"
                  className="w-full bg-white border border-rose-300 rounded-lg p-2 text-slate-900 font-bold focus:border-[#006633] focus:outline-none" />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Target Host / URL / Connection Info</label>
                <input type="text" value={newChallenge.target_info}
                  onChange={(e) => setNewChallenge({ ...newChallenge, target_info: e.target.value })}
                  placeholder="e.g. 172.16.105.9:3000"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:border-[#006633] focus:outline-none" />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Description &amp; Prompt</label>
                <textarea rows={3} value={newChallenge.description}
                  onChange={(e) => setNewChallenge({ ...newChallenge, description: e.target.value })}
                  required placeholder="Challenge description and instructions..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:border-[#006633] focus:outline-none font-sans text-xs leading-relaxed" />
              </div>

              <div className="flex items-center space-x-2">
                <input type="checkbox" id="newEnabled" checked={newChallenge.is_enabled}
                  onChange={(e) => setNewChallenge({ ...newChallenge, is_enabled: e.target.checked })}
                  className="rounded bg-slate-50 border-slate-300 text-[#006633] focus:ring-0" />
                <label htmlFor="newEnabled" className="text-slate-700 cursor-pointer">Challenge is active and visible to participants immediately</label>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl transition-colors font-medium">
                  Cancel
                </button>
                <button type="submit" disabled={creating}
                  className="px-5 py-2 bg-[#006633] hover:bg-[#004d26] text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center space-x-1.5 shadow-sm">
                  <span>{creating ? 'Creating...' : 'Create Challenge'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

