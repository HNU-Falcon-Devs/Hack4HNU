import React, { useEffect, useState } from 'react';
import { Bell, Plus, Pin, Trash2, Megaphone, ShieldAlert, Sparkles, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

const CATEGORIES = ['Competition', 'Challenge Release', 'Rules & Reminders', 'Maintenance', 'Important Update'];

export default function AnnouncementsPage({ user, isAdmin }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Competition');
  const [isPinned, setIsPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    setLoading(true);
    const res = await api.getAnnouncements();
    if (res.status === 'success' && res.announcements) {
      setAnnouncements(res.announcements);
    }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitting(true);
    const res = await api.createAnnouncement({
      title: title.trim(),
      content: content.trim(),
      category,
      is_pinned: isPinned ? 1 : 0
    });
    setSubmitting(false);

    if (res.status === 'success') {
      setTitle('');
      setContent('');
      setIsPinned(false);
      setShowAddModal(false);
      loadAnnouncements();
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    await api.deleteAnnouncement(id);
    loadAnnouncements();
  };

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'Competition': return 'bg-cyan-950/80 border-cyan-800 text-cyan-300';
      case 'Challenge Release': return 'bg-purple-950/80 border-purple-800 text-purple-300';
      case 'Rules & Reminders': return 'bg-amber-950/80 border-amber-800 text-amber-300';
      case 'Maintenance': return 'bg-red-950/80 border-red-800 text-red-300';
      default: return 'bg-blue-950/80 border-blue-800 text-blue-300';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 sm:p-8 shadow-sm flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs">
            <Megaphone className="w-4 h-4" />
            <span className="uppercase tracking-wider font-bold">Official Broadcast Feed</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Announcements & Bulletins
          </h1>
          <p className="text-xs text-gray-400">
            Important operational updates, challenge drops, and competition notices.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition shadow-lg shadow-cyan-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Publish Broadcast</span>
          </button>
        )}
      </div>

      {/* Admin Publish Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white font-mono">Publish Competition Announcement</h3>
            
            <form onSubmit={handleCreate} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-gray-400 mb-1">Headline Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Forensics Category Hint Released"
                  required
                  className="w-full bg-[#080D18] border border-gray-700 rounded-lg p-2.5 text-white focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#080D18] border border-gray-700 rounded-lg p-2.5 text-white focus:border-cyan-400"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Message Content</label>
                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Detailed announcement content..."
                  required
                  className="w-full bg-[#080D18] border border-gray-700 rounded-lg p-2.5 text-white focus:border-cyan-400 font-sans text-sm"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="pin"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="rounded bg-[#080D18] border-gray-700 text-cyan-500 focus:ring-0"
                />
                <label htmlFor="pin" className="text-gray-300 cursor-pointer">Pin to top of participant dashboards</label>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition disabled:opacity-50"
                >
                  {submitting ? 'Broadcasting...' : 'Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Announcements List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-gray-400 font-mono text-sm">
            Loading announcements...
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-12 bg-[#111827] border border-[#1E293B] rounded-2xl p-6 text-gray-500 font-mono text-sm">
            No announcements published yet.
          </div>
        ) : (
          announcements.map((ann) => (
            <div 
              key={ann.id}
              className={`bg-[#111827] border rounded-xl p-5 shadow-sm space-y-3 transition ${
                ann.is_pinned ? 'border-cyan-500/50 bg-gradient-to-r from-[#111827] to-[#0d1c28]' : 'border-[#1E293B]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-mono border ${getCategoryColor(ann.category)}`}>
                    {ann.category}
                  </span>
                  {ann.is_pinned && (
                    <span className="flex items-center space-x-1 text-[11px] font-mono text-cyan-400 font-bold">
                      <Pin className="w-3.5 h-3.5 fill-cyan-400" />
                      <span>PINNED</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-3 text-xs font-mono text-gray-400">
                  <span>{ann.created_at}</span>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(ann.id)}
                      className="text-red-400 hover:text-red-300 p-1 hover:bg-red-950/40 rounded transition"
                      title="Delete Announcement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <h2 className="text-base font-bold text-white tracking-wide">{ann.title}</h2>
              <div className="text-sm text-gray-300 leading-relaxed font-sans whitespace-pre-line">
                {ann.content}
              </div>

              <div className="text-[11px] font-mono text-gray-500 pt-2 border-t border-gray-800/80">
                Posted by: <span className="text-gray-300">{ann.author || 'Administrator'}</span>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}

