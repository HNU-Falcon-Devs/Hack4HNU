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
      case 'Competition': return 'bg-emerald-950/80 border-emerald-800 text-[#10B981]';
      case 'Challenge Release': return 'bg-amber-950/80 border-amber-800 text-[#F59E0B]';
      case 'Rules & Reminders': return 'bg-blue-950/80 border-blue-800 text-blue-300';
      case 'Maintenance': return 'bg-red-950/80 border-red-800 text-red-300';
      default: return 'bg-emerald-950/80 border-emerald-800 text-emerald-300';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="bg-[#1a2234] border border-[#26334a] rounded-2xl p-6 sm:p-8 shadow-lg flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-[#F59E0B] font-mono text-xs font-bold">
            <Megaphone className="w-4 h-4" />
            <span className="uppercase tracking-wider">Official Broadcast Feed</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Notices & Bulletins
          </h1>
          <p className="text-xs text-gray-400">
            Important operational updates, challenge drops, and competition notices.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-[#059669] to-[#10B981] hover:from-[#047857] hover:to-[#059669] text-white font-mono px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition shadow-md shadow-emerald-900/30"
          >
            <Plus className="w-4 h-4" />
            <span>Publish Broadcast</span>
          </button>
        )}
      </div>

      {/* Admin Publish Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1a2234] border border-[#26334a] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Publish Competition Notice</h3>
            
            <form onSubmit={handleCreate} className="space-y-3 font-sans text-xs">
              <div>
                <label className="block text-gray-400 mb-1">Headline Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Challenge Hint Released"
                  required
                  className="w-full bg-[#121722] border border-[#26334a] rounded-xl p-2.5 text-white focus:border-[#10B981] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#121722] border border-[#26334a] rounded-xl p-2.5 text-white focus:border-[#10B981] focus:outline-none"
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
                  className="w-full bg-[#121722] border border-[#26334a] rounded-xl p-2.5 text-white focus:border-[#10B981] focus:outline-none font-sans text-sm"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="pin"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="rounded bg-[#121722] border-[#26334a] text-emerald-500 focus:ring-0"
                />
                <label htmlFor="pin" className="text-gray-300 cursor-pointer">Pin to top of participant dashboards</label>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-[#121722] hover:bg-[#202b3d] text-gray-300 border border-[#26334a] rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-gradient-to-r from-[#059669] to-[#10B981] hover:from-[#047857] hover:to-[#059669] text-white font-bold rounded-xl transition shadow-md shadow-emerald-900/30 disabled:opacity-50"
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
          <div className="text-center py-12 bg-[#1a2234] border border-[#26334a] rounded-2xl p-6 text-gray-400 font-mono text-sm">
            No announcements published yet.
          </div>
        ) : (
          announcements.map((ann) => (
            <div 
              key={ann.id}
              className={`bg-[#1a2234] border rounded-2xl p-5 shadow-md space-y-3 transition ${
                ann.is_pinned 
                  ? 'border-[#10B981] bg-gradient-to-r from-[#1a2234] to-[#122820] shadow-[0_0_18px_rgba(16,185,129,0.18)]' 
                  : 'border-[#26334a]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono border font-bold ${getCategoryColor(ann.category)}`}>
                    {ann.category}
                  </span>
                  {ann.is_pinned && (
                    <span className="flex items-center space-x-1 text-[11px] font-mono text-[#F59E0B] font-bold">
                      <Pin className="w-3.5 h-3.5 fill-[#F59E0B]" />
                      <span>PINNED</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-3 text-xs font-mono text-gray-400">
                  <span>{ann.created_at}</span>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(ann.id)}
                      className="text-red-400 hover:text-red-300 p-1 hover:bg-red-950/40 rounded-lg transition"
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

              <div className="text-[11px] font-mono text-gray-400 pt-2 border-t border-[#26334a]">
                {ann.created_at}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
