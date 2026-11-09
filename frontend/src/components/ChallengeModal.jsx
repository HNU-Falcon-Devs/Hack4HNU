import React, { useState } from 'react';
import {
  X, Download, Flag, CheckCircle, AlertCircle, Info, ExternalLink,
  Image as ImageIcon, ShieldCheck, Terminal, HelpCircle
} from 'lucide-react';
import { api } from '../services/api';

export default function ChallengeModal({ challenge, onClose, onSolveSuccess, isAdmin, user }) {
  const [flag, setFlag] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  if (!challenge) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!flag.trim()) return;

    setLoading(true);
    setFeedback(null);

    const res = await api.submitFlag(challenge.id, flag.trim());
    setLoading(false);

    if (res.status === 'success') {
      setFeedback({
        type: 'success',
        message: res.message || 'Challenge solved successfully!'
      });
      if (onSolveSuccess) {
        onSolveSuccess(challenge.id);
      }
    } else if (res.status === 'info') {
      setFeedback({
        type: 'info',
        message: res.message || 'Challenge already solved by your team.'
      });
      if (onSolveSuccess) {
        onSolveSuccess(challenge.id);
      }
    } else {
      setFeedback({
        type: 'error',
        message: res.message || 'Incorrect flag. Please analyze the materials and try again.'
      });
    }
  };

  const getDifficultyColor = (diff) => {
    switch (diff?.toLowerCase()) {
      case 'easy': return 'text-[#006633] bg-emerald-50 border-emerald-300';
      case 'medium': return 'text-amber-700 bg-amber-50 border-amber-300';
      case 'hard': return 'text-rose-700 bg-rose-50 border-rose-300';
      default: return 'text-cyan-700 bg-cyan-50 border-cyan-300';
    }
  };

  const getCategoryColor = (cat) => {
    switch (cat?.toLowerCase()) {
      case 'web': return 'text-blue-700 border-blue-200 bg-blue-50';
      case 'osint': return 'text-purple-700 border-purple-200 bg-purple-50';
      case 'network': return 'text-indigo-700 border-indigo-200 bg-indigo-50';
      case 'forensics': return 'text-emerald-700 border-emerald-200 bg-emerald-50';
      case 'steganography': return 'text-pink-700 border-pink-200 bg-pink-50';
      default: return 'text-amber-700 border-amber-200 bg-amber-50';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white border border-slate-200 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8">

        {/* Top green & gold stripe */}
        <div className="h-1 bg-[#006633] w-full" />
        <div className="h-0.5 bg-[#eab308] w-full" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-3">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${getCategoryColor(challenge.category)}`}>
              {challenge.category}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getDifficultyColor(challenge.difficulty)}`}>
              {challenge.difficulty}
            </span>
            {challenge.is_solved && (
              <span className="flex items-center space-x-1 text-xs text-[#006633] bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded-full font-mono font-bold">
                <span>{challenge.solved_by_teammate ? 'SOLVED BY TEAM' : 'SOLVED'}</span>
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">

          {/* Team Solve Info Banner if solved */}
          {challenge.is_solved && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start space-x-3 text-xs text-[#006633]">
              <div>
                <p className="font-bold text-slate-900">
                  {challenge.solved_by_teammate
                    ? `Solved by teammate ${challenge.solved_by_username}`
                    : `You solved this challenge!`}
                </p>
                <p className="text-slate-600 font-sans mt-0.5">
                  {challenge.points} points have been credited to your team's total score.
                </p>
              </div>
            </div>
          )}

          {/* Title & Points */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-wide">{challenge.title}</h2>
              <p className="text-xs text-slate-500 font-mono mt-1">HNU CTF Official Challenge</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-mono font-bold text-[#eab308]">{challenge.points}</span>
              <span className="text-xs text-slate-500 block uppercase font-mono">Points</span>
            </div>
          </div>

          {/* Target Host or Connection Information */}
          {challenge.target_info && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-[#006633] font-mono font-bold">
                <span className="select-all">{challenge.target_info}</span>
              </div>
              {challenge.target_info.startsWith('http') && (
                <a
                  href={challenge.target_info}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs flex items-center space-x-1 text-[#006633] hover:text-[#004d26] bg-emerald-50 border border-emerald-300 px-2.5 py-1 rounded-lg transition-colors font-medium"
                >
                  <span>Open Target</span>
                </a>
              )}
            </div>
          )}

          {/* Description */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h4 className="text-xs uppercase font-mono font-bold text-[#006633] tracking-wider mb-2">Description</h4>
            <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-sans">
              {challenge.description}
            </div>
          </div>

          {/* Preserved Downloadable Attachments */}
          {challenge.attachments && challenge.attachments.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs uppercase font-mono tracking-wider text-slate-500 flex items-center space-x-1.5">
                <span>Downloadable Challenge Files ({challenge.attachments.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {challenge.attachments.map((file, idx) => (
                  <a
                    key={idx}
                    href={api.getDownloadUrl(file.id, challenge.slug, file.filename)}
                    download={file.filename}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-[#006633] hover:bg-slate-100 transition-colors group"
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <div className="truncate">
                        <p className="text-xs font-mono font-medium text-slate-900 truncate">{file.filename}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{formatFileSize(file.file_size)}</p>
                      </div>
                    </div>
                    <span className="text-xs text-[#006633] font-mono font-semibold ml-2 group-hover:underline">
                      Download
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Administrator Flag Preview */}
          {isAdmin && challenge.correct_flag && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs font-mono">
              <span className="text-rose-700 font-bold uppercase">Admin Flag Key: </span>
              <span className="text-slate-900 select-all font-bold">{challenge.correct_flag}</span>
            </div>
          )}

          {/* Feedback Messages */}
          {feedback && (
            <div className={`p-3 rounded-xl border flex items-start space-x-2.5 text-sm ${feedback.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-[#006633] font-medium' :
              feedback.type === 'info' ? 'bg-blue-50 border-blue-300 text-blue-800' :
                'bg-rose-50 border-rose-300 text-rose-700'
              }`}>
              <div className="leading-snug">{feedback.message}</div>
            </div>
          )}

          {/* Flag Submission Form */}
          <form onSubmit={handleSubmit} className="space-y-3 pt-2">
            <label className="block text-xs uppercase font-mono tracking-wider text-slate-700 font-medium">
              Submit flag
            </label>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={flag}
                  onChange={(e) => setFlag(e.target.value)}
                  placeholder="HNU{flag_is_Hidden}"
                  disabled={challenge.is_solved}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-[#006633] rounded-xl px-4 py-2.5 text-sm font-mono text-slate-900 placeholder-slate-400 disabled:opacity-50 transition-colors focus:outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading || challenge.is_solved}
                className="bg-[#006633] hover:bg-[#004d26] text-white px-5 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-colors shadow-sm disabled:opacity-50 flex items-center space-x-2"
              >
                {loading ? (
                  <span>Checking...</span>
                ) : challenge.is_solved ? (
                  <span>Solved</span>
                ) : (
                  <span>Submit Flag</span>
                )}
              </button>
            </div>
          </form>

        </div>

      </div>
    </div>
  );
}

