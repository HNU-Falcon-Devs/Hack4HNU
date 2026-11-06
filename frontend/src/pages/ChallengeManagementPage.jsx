import React, { useEffect, useState } from 'react';
import { 
  Flag, Edit3, Eye, EyeOff, CheckCircle, Power, Users, Plus, 
  Search, Download, ExternalLink, ShieldCheck, RefreshCw, X
} from 'lucide-react';
import { api } from '../services/api';

const CATEGORIES = ['Web', 'OSINT', 'Network', 'Forensics', 'Steganography', 'Miscellaneous'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

export default function ChallengeManagementPage() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editChallenge, setEditChallenge] = useState(null);
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
      <div className="bg-[#1a2234] border border-[#26334a] rounded-2xl p-6 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-emerald-950/80 border border-emerald-800/80 rounded-xl text-[#10B981] shadow-lg shadow-emerald-950/50">
            <Flag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight font-mono">
              Challenge Administration & Flag Control
            </h1>
            <p className="text-xs text-gray-400 font-mono">
              Configure correct flags, edit descriptions, toggle visibility, and inspect solve telemetry.
            </p>
          </div>
        </div>

        <button
          onClick={loadChallenges}
          disabled={loading}
          className="px-3.5 py-2 bg-[#121722] hover:bg-[#202b3d] border border-[#26334a] text-gray-300 rounded-xl text-xs font-mono flex items-center space-x-1.5 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Reload Challenges</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-[#1a2234] border border-[#26334a] rounded-2xl p-4 shadow-lg flex items-center justify-between">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="w-3.5 h-3.5 text-[#10B981]" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search challenges by title or category..."
            className="w-full bg-[#121722] border border-[#26334a] rounded-xl pl-8 pr-3 py-1.5 text-xs font-mono text-white placeholder-gray-500 focus:border-[#10B981] transition"
          />
        </div>
        <span className="text-xs text-gray-400 font-mono hidden sm:block">
          Total Imported: {challenges.length}
        </span>
      </div>

      {/* Challenges Admin Table */}
      <div className="bg-[#1a2234] border border-[#26334a] rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#161c2d] text-gray-400 border-b border-[#26334a] uppercase tracking-wider text-[11px]">
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
            <tbody className="divide-y divide-gray-800/80">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-5 py-12 text-center text-gray-400">
                    Loading challenge configurations...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-5 py-12 text-center text-gray-500">
                    No challenges matched your query.
                  </td>
                </tr>
              ) : (
                filtered.map((ch) => {
                  const isRevealed = revealFlags[ch.id];
                  return (
                    <tr key={ch.id} className="hover:bg-gray-800/30 transition">
                      <td className="px-5 py-3.5 text-gray-500 font-bold">#{ch.id}</td>
                      <td className="px-5 py-3.5 font-bold text-white whitespace-nowrap">{ch.title}</td>
                      <td className="px-5 py-3.5 text-cyan-300">{ch.category}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-[#080D18] border border-gray-800">
                          {ch.difficulty}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-cyan-400">{ch.points}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-gray-300 select-all font-mono">
                            {isRevealed ? (ch.correct_flag || 'N/A') : '••••••••••••••••••••'}
                          </span>
                          <button
                            onClick={() => toggleFlagReveal(ch.id)}
                            className="text-gray-500 hover:text-cyan-400 p-0.5"
                            title={isRevealed ? 'Mask Flag' : 'Reveal Flag'}
                          >
                            {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <button
                          onClick={() => handleToggle(ch.id)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center space-x-1 ${
                            ch.is_enabled 
                              ? 'bg-green-950/80 border-green-800 text-green-400' 
                              : 'bg-red-950/80 border-red-800 text-red-400'
                          }`}
                        >
                          <Power className="w-3 h-3" />
                          <span>{ch.is_enabled ? 'Active' : 'Disabled'}</span>
                        </button>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <button
                          onClick={() => openSolversModal(ch)}
                          className="text-cyan-400 hover:underline flex items-center space-x-1"
                        >
                          <Users className="w-3 h-3" />
                          <span>{ch.solve_count || 0} solvers</span>
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => setEditChallenge({ ...ch })}
                          className="px-2.5 py-1 bg-[#080D18] hover:bg-cyan-950/60 border border-gray-700 hover:border-cyan-500/50 text-cyan-300 rounded text-[11px] font-bold flex items-center space-x-1 ml-auto transition"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <h3 className="text-base font-bold text-white font-mono flex items-center space-x-2">
                <Edit3 className="w-4 h-4 text-cyan-400" />
                <span>Configure Challenge: {editChallenge.title}</span>
              </h3>
              <button onClick={() => setEditChallenge(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1">Challenge Title</label>
                  <input
                    type="text"
                    value={editChallenge.title}
                    onChange={(e) => setEditChallenge({ ...editChallenge, title: e.target.value })}
                    required
                    className="w-full bg-[#080D18] border border-gray-700 rounded p-2 text-white focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Category</label>
                  <select
                    value={editChallenge.category}
                    onChange={(e) => setEditChallenge({ ...editChallenge, category: e.target.value })}
                    className="w-full bg-[#080D18] border border-gray-700 rounded p-2 text-white focus:border-cyan-400"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1">Difficulty</label>
                  <select
                    value={editChallenge.difficulty}
                    onChange={(e) => setEditChallenge({ ...editChallenge, difficulty: e.target.value })}
                    className="w-full bg-[#080D18] border border-gray-700 rounded p-2 text-white focus:border-cyan-400"
                  >
                    {DIFFICULTIES.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Point Value</label>
                  <input
                    type="number"
                    min="1"
                    max="5000"
                    value={editChallenge.points}
                    onChange={(e) => setEditChallenge({ ...editChallenge, points: parseInt(e.target.value) || 0 })}
                    required
                    className="w-full bg-[#080D18] border border-gray-700 rounded p-2 text-white focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Correct Flag Input */}
              <div className="bg-[#080D18] p-3 rounded-lg border border-red-900/60 space-y-1">
                <label className="block text-red-400 font-bold uppercase tracking-wider">
                  Correct Flag Key (Format: HNU&#123;...&#125;)
                </label>
                <input
                  type="text"
                  value={editChallenge.correct_flag || ''}
                  onChange={(e) => setEditChallenge({ ...editChallenge, correct_flag: e.target.value })}
                  required
                  placeholder="HNU{your_secret_flag}"
                  className="w-full bg-[#111827] border border-red-800 rounded p-2 text-white font-bold select-all focus:border-red-500"
                />
                <p className="text-[10px] text-gray-500">
                  Case-sensitive verification. Submissions matching this exact string award points.
                </p>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Target Host / Connection Info / URL</label>
                <input
                  type="text"
                  value={editChallenge.target_info || ''}
                  onChange={(e) => setEditChallenge({ ...editChallenge, target_info: e.target.value })}
                  placeholder="e.g. 172.16.105.9:3000 or Target IP: 124.6.144.115"
                  className="w-full bg-[#080D18] border border-gray-700 rounded p-2 text-white focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Description & Prompt Instructions</label>
                <textarea
                  rows={4}
                  value={editChallenge.description}
                  onChange={(e) => setEditChallenge({ ...editChallenge, description: e.target.value })}
                  required
                  className="w-full bg-[#080D18] border border-gray-700 rounded p-2 text-white focus:border-cyan-400 font-sans text-xs leading-relaxed"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="enabledCheck"
                  checked={editChallenge.is_enabled}
                  onChange={(e) => setEditChallenge({ ...editChallenge, is_enabled: e.target.checked })}
                  className="rounded bg-[#080D18] border-gray-700 text-cyan-500 focus:ring-0"
                />
                <label htmlFor="enabledCheck" className="text-gray-300 cursor-pointer">
                  Challenge is active and visible to participants
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setEditChallenge(null)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded transition disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-gray-800">
              <h3 className="text-sm font-bold text-white font-mono flex items-center space-x-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Solvers for: {showSolversModal.title}</span>
              </h3>
              <button onClick={() => setShowSolversModal(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2">
              {solversLoading ? (
                <div className="text-center py-6 text-gray-400">Loading solvers list...</div>
              ) : solversList.length === 0 ? (
                <div className="text-center py-6 text-gray-500">No participants have solved this challenge yet.</div>
              ) : (
                solversList.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded bg-[#080D18] border border-gray-800">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500 font-bold">#{idx + 1}</span>
                      <span className="text-white font-bold">{s.username}</span>
                    </div>
                    <span className="text-gray-400 text-[10px]">{s.solved_at}</span>
                  </div>
                ))
              )}
            </div>

            <div className="text-right pt-2 border-t border-gray-800">
              <button
                onClick={() => setShowSolversModal(null)}
                className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

