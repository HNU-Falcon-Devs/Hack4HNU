import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Flag, CheckCircle, Download, ExternalLink, 
  Sparkles, Layers, Shield, Terminal
} from 'lucide-react';
import { api } from '../services/api';
import ChallengeModal from '../components/ChallengeModal';

const CATEGORIES = ['All', 'Web', 'OSINT', 'Network', 'Forensics', 'Steganography', 'Miscellaneous'];
const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];
const STATUSES = [
  { id: 'all', label: 'All Status' },
  { id: 'unsolved', label: 'Unsolved Only' },
  { id: 'solved', label: 'Solved Only' },
];

export default function ChallengeExplorer({ user, isAdmin }) {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [activeChallenge, setActiveChallenge] = useState(null);

  useEffect(() => {
    loadChallenges();
  }, [selectedCategory, selectedDifficulty, selectedStatus, search]);

  const loadChallenges = async () => {
    setLoading(true);
    const params = {};
    if (selectedCategory !== 'All') params.category = selectedCategory;
    if (selectedDifficulty !== 'All') params.difficulty = selectedDifficulty;
    if (selectedStatus !== 'all') params.status = selectedStatus;
    if (search.trim()) params.search = search.trim();

    const res = await api.getChallenges(params);
    if (res.status === 'success' && res.challenges) {
      setChallenges(res.challenges);
    }
    setLoading(false);
  };

  const handleSolveSuccess = (solvedId) => {
    setChallenges(prev => prev.map(ch => {
      if (ch.id === solvedId) {
        return { ...ch, is_solved: true, solve_count: (ch.solve_count || 0) + 1 };
      }
      return ch;
    }));
    if (activeChallenge && activeChallenge.id === solvedId) {
      setActiveChallenge(prev => ({ ...prev, is_solved: true }));
    }
  };

  const getDifficultyBadge = (diff) => {
    switch (diff?.toLowerCase()) {
      case 'easy': return 'text-green-400 bg-green-950/60 border-green-800';
      case 'medium': return 'text-amber-400 bg-amber-950/60 border-amber-800';
      case 'hard': return 'text-red-400 bg-red-950/60 border-red-800';
      default: return 'text-cyan-400 bg-cyan-950/60 border-cyan-800';
    }
  };

  const getCategoryBorder = (cat) => {
    switch (cat?.toLowerCase()) {
      case 'web': return 'hover:border-cyan-500/80 hover:shadow-cyan-500/10';
      case 'osint': return 'hover:border-blue-500/80 hover:shadow-blue-500/10';
      case 'network': return 'hover:border-purple-500/80 hover:shadow-purple-500/10';
      case 'forensics': return 'hover:border-emerald-500/80 hover:shadow-emerald-500/10';
      case 'steganography': return 'hover:border-pink-500/80 hover:shadow-pink-500/10';
      default: return 'hover:border-amber-500/80 hover:shadow-amber-500/10';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Search & Category Filter Header */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5 shadow-sm space-y-4">
        
        {/* Search Bar + Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              <Search className="w-4 h-4 text-cyan-400" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search challenges by title or keywords..."
              className="w-full bg-[#080D18] border border-gray-700 focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] rounded-lg pl-9 pr-3 py-2 text-sm font-mono text-white placeholder-gray-500"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            {/* Difficulty Filter */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="bg-[#080D18] border border-gray-700 text-xs font-mono text-gray-300 rounded-lg px-3 py-2 focus:border-cyan-400"
            >
              {DIFFICULTIES.map(d => (
                <option key={d} value={d}>Difficulty: {d}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-[#080D18] border border-gray-700 text-xs font-mono text-gray-300 rounded-lg px-3 py-2 focus:border-cyan-400"
            >
              {STATUSES.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Pill Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition border ${
                  isSelected
                    ? 'bg-cyan-500/20 text-[#00D4FF] border-cyan-500/60 font-bold shadow-sm'
                    : 'bg-[#080D18] text-gray-400 border-gray-800 hover:text-white hover:border-gray-700'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

      </div>

      {/* Challenges Grid */}
      {loading ? (
        <div className="text-center py-20 text-gray-400 font-mono text-sm space-y-2">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Scanning challenge archives...</p>
        </div>
      ) : challenges.length === 0 ? (
        <div className="text-center py-16 bg-[#111827] border border-[#1E293B] rounded-2xl p-8 space-y-3">
          <Flag className="w-10 h-10 text-gray-600 mx-auto" />
          <h3 className="text-base font-bold text-white font-mono">No Challenges Found</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Try adjusting your search criteria or switching categories to explore other cybersecurity domains.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {challenges.map((ch) => {
            const isSolved = ch.is_solved;
            return (
              <div
                key={ch.id}
                onClick={() => setActiveChallenge(ch)}
                className={`group relative bg-[#111827] border rounded-xl p-5 cursor-pointer transition shadow-lg flex flex-col justify-between ${
                  isSolved 
                    ? 'border-green-800/60 bg-gradient-to-b from-[#111827] to-[#0d1f18]' 
                    : `border-[#1E293B] ${getCategoryBorder(ch.category)}`
                }`}
              >
                {/* Solved Status Indicator Strip */}
                {isSolved && (
                  <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden pointer-events-none">
                    <div className="absolute transform rotate-45 bg-green-500 text-black font-mono font-extrabold text-[9px] py-0.5 right-[-35px] top-[18px] w-[120px] text-center shadow">
                      SOLVED
                    </div>
                  </div>
                )}

                <div>
                  {/* Category & Difficulty */}
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#080D18] border border-gray-800 text-gray-300 font-semibold">
                      {ch.category}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getDifficultyBadge(ch.difficulty)}`}>
                      {ch.difficulty}
                    </span>
                  </div>

                  {/* Challenge Title */}
                  <h3 className="text-base font-bold text-white group-hover:text-[#00D4FF] transition leading-snug">
                    {ch.title}
                  </h3>

                  {/* Short snippet */}
                  <p className="text-xs text-gray-400 line-clamp-2 mt-2 leading-relaxed font-sans">
                    {ch.description}
                  </p>
                </div>

                {/* Footer: Points & Solvers & Attachments */}
                <div className="mt-5 pt-3 border-t border-gray-800/80 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-mono font-bold text-[#00D4FF]">
                      {ch.points} <span className="text-[10px] text-gray-400 font-normal uppercase">PTS</span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-xs font-mono text-gray-400">
                    {ch.attachments && ch.attachments.length > 0 && (
                      <span className="flex items-center space-x-1 text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded text-[10px] border border-cyan-800">
                        <Download className="w-3 h-3" />
                        <span>{ch.attachments.length} file</span>
                      </span>
                    )}

                    <span>{ch.solve_count || 0} solves</span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Active Challenge Modal */}
      {activeChallenge && (
        <ChallengeModal
          challenge={activeChallenge}
          onClose={() => setActiveChallenge(null)}
          onSolveSuccess={handleSolveSuccess}
          isAdmin={isAdmin}
        />
      )}

    </div>
  );
}

