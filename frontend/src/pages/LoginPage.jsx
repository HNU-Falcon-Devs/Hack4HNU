import React, { useState } from 'react';
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
    <div className="min-h-screen bg-white flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 selection:bg-emerald-500/20 selection:text-emerald-900">

      <div className="max-w-md w-full space-y-6 relative z-10">

        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-24 h-24 flex items-center justify-center p-2 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <img
              src={hnuLogo}
              alt="Holy Name University Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-[#006633] italic">
            HNU <span className="text-[#eab308]">CTF</span>
          </h1>
          <p className="text-xs font-mono text-slate-500">
            Holy Name University Cybersecurity Platform
          </p>
        </div>

        {/* Login Card with HNU Green & Yellow top stripe */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

          {/* Top Green & Yellow dual stripe */}
          <div className="w-full">
            <div className="h-1 bg-[#006633]" />
            <div className="h-0.5 bg-[#eab308]" />
          </div>

          <div className="p-6 sm:p-8 space-y-5">
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider">
                User Authentication
              </span>
              <span className="text-[11px] font-mono text-[#006633] font-semibold">Authorized Access Only</span>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Username Field */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-600 mb-1.5 font-bold">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your assigned username"
                  required
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-300 focus:border-[#006633] focus:bg-white focus:outline-none rounded-xl px-4 py-2.5 text-sm font-mono text-slate-900 placeholder-slate-400 transition"
                />
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-600 mb-1.5 font-bold">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-slate-50 border border-slate-300 focus:border-[#006633] focus:bg-white focus:outline-none rounded-xl px-4 py-2.5 text-sm font-mono text-slate-900 placeholder-slate-400 transition"
                />
              </div>

              {/* Submit Button in HNU Green */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-[#006633] hover:bg-[#004d26] text-white font-mono font-bold py-2.5 px-4 rounded-xl text-sm tracking-wider uppercase transition shadow-sm disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>

            </form>



          </div>
        </div>

      </div>

    </div>
  );
}
