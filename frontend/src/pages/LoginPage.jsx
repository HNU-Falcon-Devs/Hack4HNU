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
    <div className="min-h-screen bg-[#080D18] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 selection:bg-cyan-500/30 selection:text-cyan-300">
      
      {/* Background cyber accent */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,212,255,0.15),rgba(255,255,255,0))] pointer-events-none" />

      <div className="max-w-md w-full space-y-6 relative z-10">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-24 h-24 flex items-center justify-center p-2 rounded-2xl bg-[#111827]/80 border border-emerald-500/30 shadow-xl shadow-emerald-500/10">
            <img 
              src={hnuLogo} 
              alt="Holy Name University Logo" 
              className="w-full h-full object-contain filter drop-shadow-[0_0_12px_rgba(16,185,129,0.3)]" 
            />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-mono">
            HNU <span className="text-[#00D4FF]">CTF</span>
          </h1>
          <p className="text-xs uppercase font-mono tracking-widest text-emerald-400 font-semibold">
            Holy Name University Cyber Arena
          </p>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Authorized participant & administrator security challenge gateway.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
          
          <div className="mb-6 pb-4 border-b border-gray-800 flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wider flex items-center space-x-1.5">
              <KeyRound className="w-4 h-4 text-cyan-400" />
              <span>Authentication</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700">
              No Public Registration
            </span>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-950/70 border border-red-800 text-red-300 text-xs flex items-start space-x-2 font-mono">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
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
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <User className="w-4 h-4 text-cyan-400" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your registered username"
                  required
                  autoFocus
                  className="w-full bg-[#080D18] border border-gray-700 focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] rounded-lg pl-9 pr-3 py-2.5 text-sm font-mono text-white placeholder-gray-600"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Lock className="w-4 h-4 text-cyan-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-[#080D18] border border-gray-700 focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] rounded-lg pl-9 pr-3 py-2.5 text-sm font-mono text-white placeholder-gray-600"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono font-semibold py-2.5 px-4 rounded-lg text-sm tracking-wider uppercase transition shadow-lg shadow-cyan-500/20 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Platform</span>
                </>
              )}
            </button>

          </form>

          {/* Preset Demo Accounts Helper */}
          <div className="mt-6 pt-5 border-t border-gray-800/80">
            <p className="text-[11px] font-mono text-gray-400 mb-2 flex items-center space-x-1">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Pre-Provisioned Accounts (Click to test):</span>
            </p>
            
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <button
                type="button"
                onClick={() => handleQuickFill('cyberspartan', 'Participant123!')}
                className="p-2 rounded bg-[#080D18] border border-gray-800 hover:border-cyan-500/50 text-left transition"
              >
                <div className="text-cyan-300 font-bold">cyberspartan</div>
                <div className="text-[10px] text-gray-400">Participant Account</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('admin', 'Admin@HNU2026!')}
                className="p-2 rounded bg-[#080D18] border border-gray-800 hover:border-red-500/50 text-left transition"
              >
                <div className="text-red-400 font-bold">admin</div>
                <div className="text-[10px] text-gray-400">SOC Administrator</div>
              </button>
            </div>
          </div>

        </div>

        {/* Security Notice */}
        <div className="bg-[#0B1120] border border-gray-800/80 rounded-xl p-3.5 text-xs text-gray-400 font-mono flex items-start space-x-2">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-gray-300">Account Policy:</strong> Public registration is disabled. User accounts are manually created directly in the MySQL database. See <code className="text-cyan-300">documentation/database_schema.md</code> for SQL queries.
          </div>
        </div>

      </div>

    </div>
  );
}

