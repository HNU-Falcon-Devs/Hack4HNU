import React, { useState, useEffect } from 'react';
import {
  Flag, CheckCircle, Download, ExternalLink,
  Sparkles, Layers, Shield, Terminal, Globe,
  Search as SearchIcon, Wifi, FileSearch, Image as ImageIcon, Box
} from 'lucide-react';
import { api } from '../services/api';
import ChallengeModal from '../components/ChallengeModal';

const CATEGORIES = [
  { name: 'Web', label: 'WEB', color: '#F59E0B', icon: Globe },
  { name: 'OSINT', label: 'OSINT', color: '#10B981', icon: SearchIcon },
  { name: 'Network', label: 'NETWORK', color: '#8B5CF6', icon: Wifi },
  { name: 'Forensics', label: 'FORENSICS', color: '#10B981', icon: FileSearch },
  { name: 'Steganography', label: 'STEGANOGRAPHY', color: '#F59E0B', icon: ImageIcon },
  { name: 'Miscellaneous', label: 'MISCELLANEOUS', color: '#34D399', icon: Box },
];

export default function ChallengeExplorer({ user, isAdmin }) {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChallenge, setActiveChallenge] = useState(null);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    setLoading(true);
    const res = await api.getChallenges({});
    if (res.status === 'success' && res.challenges) {
      setChallenges(res.challenges);
    }
    setLoading(false);
  };

  const handleSolveSuccess = (solvedId) => {
    setChallenges(prev => prev.map(ch => {
      if (ch.id === solvedId) {
        return {
          ...ch,
          is_solved: true,
          solve_count: (ch.solve_count || 0) + 1,
          solved_by_username: ch.solved_by_username || user?.username,
          solved_by_teammate: false
        };
      }
      return ch;
    }));
    if (activeChallenge && activeChallenge.id === solvedId) {
      setActiveChallenge(prev => ({ ...prev, is_solved: true }));
    }
  };

  const getDifficultyBadge = (diff) => {
    switch (diff?.toLowerCase()) {
      case 'easy': return 'text-[#006633] bg-emerald-50 border-emerald-300';
      case 'medium': return 'text-amber-700 bg-amber-50 border-amber-300';
      case 'hard': return 'text-rose-700 bg-rose-50 border-rose-300';
      default: return 'text-[#006633] bg-emerald-50 border-emerald-300';
    }
  };

  const getCategoryBorder = () => {
    return 'hover:border-[#006633]';
  };

  // Group challenges strictly by category
  const groupedCategories = CATEGORIES.map(cat => {
    const list = challenges.filter(c => c.category?.toLowerCase() === cat.name.toLowerCase());
    return {
      ...cat,
      challenges: list
    };
  }).filter(group => group.challenges.length > 0);

  // Fallback for any challenges with unexpected category names
  const knownCatNames = CATEGORIES.map(c => c.name.toLowerCase());
  const extraChallenges = challenges.filter(c => !knownCatNames.includes(c.category?.toLowerCase()));
  if (extraChallenges.length > 0) {
    groupedCategories.push({
      name: 'Other',
      label: 'OTHER CHALLENGES',
      color: '#006633',
      icon: Flag,
      challenges: extraChallenges
    });
  }

  return (
    <div className="space-y-10">

      {loading ? (
        <div className="text-center py-24 text-slate-500 font-mono text-sm space-y-3">
          <div className="w-9 h-9 border-2 border-[#006633] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="tracking-wide">Loading arena challenges...</p>
        </div>
      ) : groupedCategories.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 font-mono text-sm">
          No challenges available at this time.
        </div>
      ) : (
        groupedCategories.map((group) => {
          const solvedCount = group.challenges.filter(c => c.is_solved).length;
          const totalPoints = group.challenges.reduce((sum, c) => sum + (c.points || 0), 0);
          const Icon = group.icon || Flag;

          return (
            <section key={group.name} className="space-y-4">

              {/* Category Section Header (e.g. WEB, OSINT, NETWORK...) */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center space-x-3">
                  <h2
                    className="text-lg sm:text-xl font-black font-mono tracking-wider uppercase text-slate-900 flex items-center space-x-2"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-[#006633]" />
                    <span>{group.label}</span>
                  </h2>
                </div>
              </div>

              {/* Responsive Cards Grid for this category: web | web | web */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {group.challenges.map((ch) => {
                  const isSolved = ch.is_solved;
                  return (
                    <div
                      key={ch.id}
                      onClick={() => setActiveChallenge(ch)}
                      className={`group relative bg-white border rounded-2xl p-5 cursor-pointer transition-colors shadow-sm flex flex-col justify-between ${isSolved
                        ? 'border-[#006633] bg-emerald-50/20'
                        : `border-slate-200 hover:border-[#006633]`
                        }`}
                    >
                      {/* Solved Status Indicator Strip */}
                      {isSolved && (
                        <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden pointer-events-none">
                          <div className="absolute transform rotate-45 bg-[#006633] text-white font-black text-[8px] py-1 right-[-40px] top-[24px] w-[140px] text-center shadow tracking-wider uppercase">
                            {ch.solved_by_teammate ? 'SOLVED BY TEAM' : 'SOLVED'}
                          </div>
                        </div>
                      )}

                      <div>
                        {/* Category & Difficulty */}
                        <div className="flex items-center space-x-2 mb-3">
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold">
                            {ch.category}
                          </span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${getDifficultyBadge(ch.difficulty)}`}>
                            {ch.difficulty}
                          </span>
                        </div>

                        {/* Challenge Title */}
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-[#006633] transition-colors leading-snug">
                          {ch.title}
                        </h3>

                        {/* Solved by teammate info if applicable */}
                        {isSolved && ch.solved_by_username && (
                          <p className="text-[10px] font-mono text-[#006633] mt-1 flex items-center space-x-1">
                            <span>Solved by {ch.solved_by_username} {ch.solved_by_username === user?.username ? '(You)' : ''}</span>
                          </p>
                        )}

                        {/* Short snippet */}
                        <p className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed font-sans">
                          {ch.description}
                        </p>
                      </div>

                      {/* Footer: Points & Solvers & Attachments */}
                      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <span className="text-lg font-mono font-bold text-[#eab308]">
                            {ch.points}
                          </span>
                          <span className="text-[10px] text-slate-500 font-bold uppercase">PTS</span>
                        </div>

                        <div className="flex items-center space-x-2 text-xs font-mono text-slate-500">
                          {ch.attachments && ch.attachments.length > 0 && (
                            <span className="flex items-center space-x-1 text-[#006633] bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] border border-emerald-200">
                              <span>{ch.attachments.length} file</span>
                            </span>
                          )}

                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>

            </section>
          );
        })
      )}

      {/* Active Challenge Modal */}
      {activeChallenge && (
        <ChallengeModal
          challenge={activeChallenge}
          onClose={() => setActiveChallenge(null)}
          onSolveSuccess={handleSolveSuccess}
          isAdmin={isAdmin}
          user={user}
        />
      )}

    </div>
  );
}
