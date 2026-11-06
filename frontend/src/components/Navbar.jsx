import React, { useState } from 'react';
import {
  Shield, Flag, Trophy, Bell, Activity, Users, FileText,
  LogOut, ShieldAlert, Database, Server, ChevronDown, CheckCircle,
  AlertTriangle, Clock, Sparkles
} from 'lucide-react';
import hnuLogo from '../assets/hnu-logo.png';
import { useCompetitionTimer } from '../hooks/useCompetitionTimer';

export default function Navbar({ user, onLogout, activeTab, setActiveTab, dbConnected }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const isAdmin = user?.role === 'admin';
  const { formatted, isExpired } = useCompetitionTimer(25200);

  const teamDisplay = user?.team_name || (isAdmin ? 'SOC Command' : 'Team Alpha');

  return (
    <header className="bg-[#161c2d] border-b border-[#242f44] sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo & Platform Title (Sleek CTF branding from reference) */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <img
              src={hnuLogo}
              alt="Holy Name University Logo"
              className="w-9 h-9 object-contain drop-shadow-[0_2px_8px_rgba(16,185,129,0.35)]"
            />
            <div className="flex items-center space-x-2">
              <span className="font-black italic text-2xl tracking-tighter text-[#F59E0B]">
                HNU <span className="text-[#10B981]">CTF</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#101522] border border-[#242f44] text-[#34D399] font-medium">
                Cyber Arena
              </span>
            </div>
          </div>

          {/* Navigation Links (Horizontal underline style from reference UI) */}
          <nav className="hidden md:flex items-center space-x-1 h-full">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-3.5 h-16 text-sm font-semibold transition border-b-2 ${activeTab === 'dashboard'
                ? 'border-[#EAB308] text-[#F59E0B]'
                : 'border-transparent text-gray-300 hover:text-white hover:border-gray-600'
                }`}
            >
              <Activity className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('challenges')}
              className={`flex items-center space-x-2 px-3.5 h-16 text-sm font-semibold transition border-b-2 ${activeTab === 'challenges'
                ? 'border-[#10B981] text-[#10B981]'
                : 'border-transparent text-gray-300 hover:text-white hover:border-gray-600'
                }`}
            >
              <Flag className="w-4 h-4" />
              <span>Challenges</span>
            </button>

            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center space-x-2 px-3.5 h-16 text-sm font-semibold transition border-b-2 ${activeTab === 'leaderboard'
                ? 'border-[#10B981] text-[#10B981]'
                : 'border-transparent text-gray-300 hover:text-white hover:border-gray-600'
                }`}
            >
              <Trophy className="w-4 h-4" />
              <span>{isAdmin ? 'Integral Details' : 'Team Scores'}</span>
            </button>

            <button
              onClick={() => setActiveTab('announcements')}
              className={`flex items-center space-x-2 px-3.5 h-16 text-sm font-semibold transition border-b-2 ${activeTab === 'announcements'
                ? 'border-[#10B981] text-[#10B981]'
                : 'border-transparent text-gray-300 hover:text-white hover:border-gray-600'
                }`}
            >
              <Bell className="w-4 h-4" />
              <span>Announcements</span>
            </button>

            {/* Administrator Only SOC Tabs */}
            {isAdmin && (
              <div className="flex items-center space-x-1 pl-3 border-l border-[#242f44] ml-2 h-8">
                <button
                  onClick={() => setActiveTab('soc')}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${activeTab === 'soc'
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/60'
                    : 'text-gray-400 hover:text-white hover:bg-[#1a2234]'
                    }`}
                  title="Security Operations Center"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
                  <span>SOC</span>
                </button>

                <button
                  onClick={() => setActiveTab('attacks')}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${activeTab === 'attacks'
                    ? 'bg-red-950/80 text-red-300 border border-red-600/60'
                    : 'text-gray-400 hover:text-white hover:bg-[#1a2234]'
                    }`}
                  title="Live Attack Monitor & Brute Force Detection"
                >
                  <Activity className="w-3.5 h-3.5 text-red-400" />
                  <span>Attacks</span>
                </button>

                <button
                  onClick={() => setActiveTab('ip_management')}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${activeTab === 'ip_management'
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-600/60'
                    : 'text-gray-400 hover:text-white hover:bg-[#1a2234]'
                    }`}
                  title="IP Blocking and Whitelisting"
                >
                  <Server className="w-3.5 h-3.5 text-amber-400" />
                  <span>IP Filter</span>
                </button>

                <button
                  onClick={() => setActiveTab('admin_challenges')}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${activeTab === 'admin_challenges'
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/60'
                    : 'text-gray-400 hover:text-white hover:bg-[#1a2234]'
                    }`}
                  title="Manage Challenges & Correct Flags"
                >
                  <Flag className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Challenges</span>
                </button>

                <button
                  onClick={() => setActiveTab('security_logs')}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${activeTab === 'security_logs'
                    ? 'bg-purple-950/80 text-purple-300 border border-purple-600/60'
                    : 'text-gray-400 hover:text-white hover:bg-[#1a2234]'
                    }`}
                  title="SOC Security Audit Logs"
                >
                  <FileText className="w-3.5 h-3.5 text-purple-400" />
                  <span>Logs</span>
                </button>
              </div>
            )}
          </nav>

          {/* Right Section: 7-Hour Live Timer Pill & User Profile (Exact Reference Style) */}
          <div className="flex items-center space-x-3">

            {/* 7-Hour Competition Countdown Timer Pill (Reference UI style: ⏱ 07:00:00) */}
            <div
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold shadow-inner border transition ${isExpired
                ? 'bg-red-950/60 border-red-700/80 text-red-400'
                : 'bg-[#101522] border-[#242f44] text-[#10B981]'
                }`}
              title="Official 7-Hour Competition Countdown"
            >
              <Clock className="w-3.5 h-3.5 text-[#10B981] animate-pulse" />
              <span>{isExpired ? '00:00:00 (ENDED)' : formatted}</span>
            </div>

            {/* Database indicator */}
            <div
              className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border ${dbConnected
                ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-400'
                : 'bg-amber-950/40 border-amber-700/60 text-amber-300'
                }`}
              title={dbConnected ? "Connected to live MySQL database" : "Running on fallback demo dataset"}
            >
              <Database className="w-3 h-3" />
              <span>{dbConnected ? 'Live' : 'Demo'}</span>
            </div>

            {/* User Profile Pill with Team Name (Reference style: Rickie Baroch / Team: Big Boss) */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2.5 bg-[#101522] hover:bg-[#1a2234] px-3 py-1.5 rounded-full border border-[#242f44] transition shadow-md"
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${isAdmin
                  ? 'bg-gradient-to-tr from-red-600 to-amber-600 text-white shadow-sm'
                  : 'bg-gradient-to-tr from-[#059669] to-[#10B981] text-white shadow-sm'
                  }`}>
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-white tracking-wide">{user?.username}</div>
                  <div className="text-[10px] font-mono text-[#F59E0B] leading-none">
                    Team: {teamDisplay}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-[#1a2234] border border-[#26334a] rounded-xl shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-2 border-b border-[#26334a]">
                    <p className="text-[11px] text-gray-400">Signed in as</p>
                    <p className="text-sm font-bold text-white truncate">{user?.username}</p>
                    <p className="text-xs text-[#F59E0B] font-mono font-medium truncate mt-0.5">
                      Team: {teamDisplay}
                    </p>
                    <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-[#101522] border border-[#26334a] font-mono text-emerald-400 uppercase">
                      Role: {user?.role} (4 per team)
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 flex items-center space-x-2 transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}
