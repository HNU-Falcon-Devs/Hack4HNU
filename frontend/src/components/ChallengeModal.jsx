import React, { useState } from 'react';
import { 
  X, Download, Flag, CheckCircle, AlertCircle, Info, ExternalLink, 
  Image as ImageIcon, ShieldCheck, Terminal, HelpCircle
} from 'lucide-react';
import { api } from '../services/api';

export default function ChallengeModal({ challenge, onClose, onSolveSuccess, isAdmin }) {
  const [flag, setFlag] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [showScreenshot, setShowScreenshot] = useState(false);

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
        message: res.message || 'You have already solved this challenge.'
      });
    } else {
      setFeedback({
        type: 'error',
        message: res.message || 'Incorrect flag. Please analyze the materials and try again.'
      });
    }
  };

  const getDifficultyColor = (diff) => {
    switch (diff?.toLowerCase()) {
      case 'easy': return 'text-green-400 bg-green-950/60 border-green-800';
      case 'medium': return 'text-amber-400 bg-amber-950/60 border-amber-800';
      case 'hard': return 'text-red-400 bg-red-950/60 border-red-800';
      default: return 'text-cyan-400 bg-cyan-950/60 border-cyan-800';
    }
  };

  const getCategoryColor = (cat) => {
    switch (cat?.toLowerCase()) {
      case 'web': return 'text-cyan-400 border-cyan-800 bg-cyan-950/40';
      case 'osint': return 'text-blue-400 border-blue-800 bg-blue-950/40';
      case 'network': return 'text-purple-400 border-purple-800 bg-purple-950/40';
      case 'forensics': return 'text-emerald-400 border-emerald-800 bg-emerald-950/40';
      case 'steganography': return 'text-pink-400 border-pink-800 bg-pink-950/40';
      default: return 'text-amber-400 border-amber-800 bg-amber-950/40';
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-[#111827] border border-[#1E293B] rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E293B] bg-[#0B1120]">
          <div className="flex items-center space-x-3">
            <span className={`px-2.5 py-0.5 rounded text-xs font-mono border ${getCategoryColor(challenge.category)}`}>
              {challenge.category}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getDifficultyColor(challenge.difficulty)}`}>
              {challenge.difficulty}
            </span>
            {challenge.is_solved && (
              <span className="flex items-center space-x-1 text-xs text-green-400 bg-green-950/80 border border-green-800 px-2 py-0.5 rounded font-mono">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>SOLVED</span>
              </span>
            )}
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          
          {/* Title & Points */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-wide">{challenge.title}</h2>
              <p className="text-xs text-gray-400 font-mono mt-1">HNU CTF Official Challenge</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-mono font-bold text-[#00D4FF]">{challenge.points}</span>
              <span className="text-xs text-gray-400 block uppercase font-mono">Points</span>
            </div>
          </div>

          {/* Target Host or Connection Information */}
          {challenge.target_info && (
            <div className="bg-[#080D18] border border-cyan-900/60 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-cyan-300 font-mono">
                <Terminal className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="select-all">{challenge.target_info}</span>
              </div>
              {challenge.target_info.startsWith('http') && (
                <a 
                  href={challenge.target_info} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 bg-cyan-950/60 border border-cyan-800 px-2.5 py-1 rounded transition"
                >
                  <span>Open Target</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}

          {/* Description */}
          <div className="bg-[#0D1527] border border-gray-800/80 rounded-lg p-4">
            <h3 className="text-xs uppercase font-mono tracking-wider text-gray-400 mb-2">Challenge Prompt</h3>
            <div className="text-sm text-gray-200 leading-relaxed whitespace-pre-line font-sans">
              {challenge.description}
            </div>
          </div>

          {/* Preserved Downloadable Attachments */}
          {challenge.attachments && challenge.attachments.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs uppercase font-mono tracking-wider text-gray-400 flex items-center space-x-1.5">
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Downloadable Challenge Files ({challenge.attachments.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {challenge.attachments.map((file, idx) => (
                  <a
                    key={idx}
                    href={api.getDownloadUrl(file.id, challenge.slug, file.filename)}
                    download={file.filename}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#080D18] border border-gray-800 hover:border-cyan-500/50 hover:bg-gray-800/50 transition group"
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <div className="p-2 rounded bg-cyan-950/80 text-cyan-400 group-hover:bg-cyan-500/20 transition">
                        <Download className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-mono font-medium text-white truncate">{file.filename}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{formatFileSize(file.file_size)}</p>
                      </div>
                    </div>
                    <span className="text-xs text-cyan-400 font-mono font-semibold ml-2 group-hover:underline">
                      Download
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Original Screenshot Toggle */}
          <div className="border-t border-gray-800/80 pt-3">
            <button
              onClick={() => setShowScreenshot(!showScreenshot)}
              className="flex items-center space-x-2 text-xs text-gray-400 hover:text-cyan-300 font-mono transition"
            >
              <ImageIcon className="w-4 h-4" />
              <span>{showScreenshot ? 'Hide Original Challenge Screenshot' : 'View Original CTFd Screenshot'}</span>
            </button>

            {showScreenshot && (
              <div className="mt-3 p-2 bg-[#080D18] border border-gray-800 rounded-lg">
                <img 
                  src={api.getChallengeImageUrl(challenge.slug)} 
                  alt={challenge.title}
                  className="rounded max-h-80 w-auto mx-auto border border-gray-800 object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {/* Administrator Flag Preview */}
          {isAdmin && challenge.correct_flag && (
            <div className="bg-red-950/30 border border-red-800/60 rounded-lg p-3 text-xs font-mono">
              <span className="text-red-400 font-bold uppercase">Admin Flag Key: </span>
              <span className="text-white select-all">{challenge.correct_flag}</span>
            </div>
          )}

          {/* Feedback Messages */}
          {feedback && (
            <div className={`p-3 rounded-lg border flex items-start space-x-2.5 text-sm ${
              feedback.type === 'success' ? 'bg-green-950/60 border-green-800 text-green-300' :
              feedback.type === 'info' ? 'bg-blue-950/60 border-blue-800 text-blue-300' :
              'bg-red-950/60 border-red-800 text-red-300'
            }`}>
              {feedback.type === 'success' && <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />}
              {feedback.type === 'info' && <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />}
              {feedback.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
              <div className="leading-snug">{feedback.message}</div>
            </div>
          )}

          {/* Flag Submission Form */}
          <form onSubmit={handleSubmit} className="space-y-3 pt-2">
            <label className="block text-xs uppercase font-mono tracking-wider text-gray-300">
              Submit Flag <span className="text-gray-500">(Required format: HNU&#123;...&#125;)</span>
            </label>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Flag className="w-4 h-4 text-cyan-400" />
                </div>
                <input
                  type="text"
                  value={flag}
                  onChange={(e) => setFlag(e.target.value)}
                  placeholder="HNU{flag_is_Hidden}"
                  disabled={challenge.is_solved}
                  className="w-full bg-[#080D18] border border-gray-700 focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] rounded-lg pl-9 pr-3 py-2.5 text-sm font-mono text-white placeholder-gray-600 disabled:opacity-50"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading || challenge.is_solved}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition shadow-lg shadow-cyan-500/20 disabled:opacity-50 flex items-center space-x-2"
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

