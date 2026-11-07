import React, { useState } from 'react';
import { Shield, Lock, User, KeyRound, AlertCircle, Terminal, Info, Database } from 'lucide-react';
import { api } from '../services/api';
import hnuLogo from '../assets/hnu-logo.png';

export default function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setLoading(true);
    setError('');

    const res = await api.login(username.trim(), password);
    setLoading(false);

    if (res.status === 'success' && res.user) {
      onLoginSuccess(res.user);
    } else {
      setError(res.message || 'Authentication failed. Please verify your credentials.');
    }
  };

  const handleQuickFill = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-[#121722] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 selection:bg-emerald-500/30 selection:text-emerald-300">

      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.12),rgba(255,255,255,0))] pointer-events-none" />

      <div className="max-w-md w-full space-y-6 relative z-10">

        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-24 h-24 flex items-center justify-center p-2 rounded-2xl bg-[#1a2234] border border-[#26334a] shadow-xl shadow-black/40">
            <img
              src={hnuLogo}
              alt="Holy Name University Logo"
              className="w-full h-full object-contain filter drop-shadow-[0_2px_10px_rgba(16,185,129,0.35)]"
            />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white italic">
            HNU <span className="text-[#10B981]">CTF</span>
          </h1>
        </div>

        {/* Login Card (Reference Dark Matte Card) */}
        <div className="bg-[#1a2234] border border-[#26334a] rounded-2xl p-6 sm:p-8 shadow-2xl">

          <div className="mb-6 pb-4 border-b border-[#26334a] flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-gray-200 uppercase tracking-wider flex items-center space-x-1.5">
              <span>Authentication</span>
            </span>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-950/70 border border-red-800 text-red-300 text-xs flex items-start space-x-2 font-mono">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Username Field */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-1.5">
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your registered username"
                  required
                  autoFocus
                  className="w-full bg-[#121722] border border-[#26334a] focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] rounded-xl px-4 py-2.5 text-sm font-mono text-white placeholder-gray-500 transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-[#121722] border border-[#26334a] focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] rounded-xl px-4 py-2.5 text-sm font-mono text-white placeholder-gray-500 transition"
                />
              </div>
            </div>

            {/* Submit Button in HNU Green */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-[#059669] to-[#10B981] hover:from-[#047857] hover:to-[#059669] text-white font-mono font-bold py-2.5 px-4 rounded-xl text-sm tracking-wider uppercase transition shadow-lg shadow-emerald-900/30 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                </>
              )}
            </button>

          </form>

          {/* Preset Demo Accounts Helper */}
          <div className="mt-6 pt-5 border-t border-[#26334a]">


            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              <button
                type="button"
                onClick={() => handleQuickFill('cyberspartan', 'Participant123!')}
                className="p-2 rounded-xl bg-[#121722] border border-[#26334a] hover:border-[#10B981]/60 text-left transition"
              >
                <div className="text-[#10B981] font-bold truncate">cyberspartan</div>
                <div className="text-[10px] text-gray-400">Team Alpha</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('bravo_falcon', 'Participant123!')}
                className="p-2 rounded-xl bg-[#121722] border border-[#26334a] hover:border-[#10B981]/60 text-left transition"
              >
                <div className="text-[#10B981] font-bold truncate">bravo_falcon</div>
                <div className="text-[10px] text-gray-400">Team Bravo</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('admin', 'Admin@HNU2026!')}
                className="p-2 rounded-xl bg-[#121722] border border-[#26334a] hover:border-red-500/60 text-left transition"
              >
                <div className="text-red-400 font-bold truncate">admin</div>
                <div className="text-[10px] text-gray-400">SOC Admin</div>
              </button>
            </div>
          </div>

        </div>



      </div>

    </div>
  );
}
