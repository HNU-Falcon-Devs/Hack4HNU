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
      try {
        const allIds = res.announcements.map(a => a.id);
        localStorage.setItem('hnu_read_announcements', JSON.stringify(allIds));
      } catch { }
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
      case 'Competition': return 'bg-emerald-50 border-emerald-300 text-[#006633]';
      case 'Challenge Release': return 'bg-amber-50 border-amber-300 text-amber-700';
      case 'Rules & Reminders': return 'bg-blue-50 border-blue-300 text-blue-700';
      case 'Maintenance': return 'bg-rose-50 border-rose-300 text-rose-700';
      default: return 'bg-emerald-50 border-emerald-300 text-[#006633]';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm flex items-center justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#006633]" />
        <div className="absolute top-1 left-0 right-0 h-0.5 bg-[#eab308]" />

        <div className="space-y-1 pt-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Notices & Bulletins
          </h1>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#006633] hover:bg-[#004d26] text-white font-mono px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-colors shadow-sm"
          >
            <span>Publish Broadcast</span>
          </button>
        )}
      </div>

      {/* Admin Publish Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Publish Competition Notice</h3>

            <form onSubmit={handleCreate} className="space-y-3 font-sans text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Headline Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Challenge Hint Released"
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:border-[#006633] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:border-[#006633] focus:outline-none"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Message Content</label>
                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Detailed announcement content..."
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:border-[#006633] focus:outline-none font-sans text-sm"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="pin"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="rounded bg-slate-50 border-slate-300 text-[#006633] focus:ring-0"
                />
                <label htmlFor="pin" className="text-slate-700 cursor-pointer">Pin to top of participant dashboards</label>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#006633] hover:bg-[#004d26] text-white font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50"
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
          <div className="text-center py-12 text-slate-500 font-mono text-sm">
            Loading announcements...
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl p-6 text-slate-500 font-mono text-sm shadow-sm">
            No announcements published yet.
          </div>
        ) : (
          announcements.map((ann) => (
            <div
              key={ann.id}
              className={`bg-white border rounded-2xl p-5 shadow-sm space-y-3 transition-colors ${ann.is_pinned
                ? 'border-[#006633] bg-emerald-50/20'
                : 'border-slate-200 hover:border-[#006633]'
                }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono border font-bold ${getCategoryColor(ann.category)}`}>
                    {ann.category}
                  </span>
                  {ann.is_pinned && (
                    <span className="flex items-center space-x-1 text-[11px] font-mono text-[#eab308] font-bold">
                      <span>PINNED</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-3 text-xs font-mono text-slate-500">
                  <span>{ann.created_at}</span>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(ann.id)}
                      className="text-rose-600 hover:text-rose-800 px-2 py-0.5 hover:bg-rose-50 rounded-lg transition-colors text-xs font-bold"
                      title="Delete Announcement"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              <h2 className="text-base font-bold text-slate-900 tracking-wide">{ann.title}</h2>
              <div className="text-sm text-slate-700 leading-relaxed font-sans whitespace-pre-line">
                {ann.content}
              </div>

              <div className="text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-100">
                {ann.created_at}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
