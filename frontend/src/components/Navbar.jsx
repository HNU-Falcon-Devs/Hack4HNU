import React, { useState } from 'react';
import { 
  Shield, Flag, Trophy, Bell, Activity, Users, FileText, 
  LogOut, ShieldAlert, Database, Server, ChevronDown, CheckCircle, AlertTriangle
} from 'lucide-react';
import hnuLogo from '../assets/hnu-logo.png';

export default function Navbar({ user, onLogout, activeTab, setActiveTab, dbConnected }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const isAdmin = user?.role === 'admin';

  return (
    <header className="bg-[#111827] border-b border-[#1E293B] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <img 
              src={hnuLogo} 
              alt="Holy Name University Logo" 
              className="w-10 h-10 object-contain drop-shadow-[0_0_10px_rgba(0,212,255,0.3)]" 
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-wider text-white">HNU <span className="text-[#00D4FF]">CTF</span></span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-400 font-semibold">
                  Holy Name University
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-mono">Cybersecurity Challenge & SOC</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition ${
                activeTab === 'dashboard' 
                  ? 'bg-cyan-500/10 text-[#00D4FF] border border-cyan-500/30' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-800/60'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('challenges')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition ${
                activeTab === 'challenges' 
                  ? 'bg-cyan-500/10 text-[#00D4FF] border border-cyan-500/30' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-800/60'
              }`}
            >
              <Flag className="w-4 h-4" />
              <span>Challenges</span>
            </button>

            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition ${
                activeTab === 'leaderboard' 
                  ? 'bg-cyan-500/10 text-[#00D4FF] border border-cyan-500/30' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-800/60'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Leaderboard</span>
            </button>

            <button
              onClick={() => setActiveTab('announcements')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition ${
                activeTab === 'announcements' 
                  ? 'bg-cyan-500/10 text-[#00D4FF] border border-cyan-500/30' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-800/60'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Announcements</span>
            </button>

            {/* Administrator Only SOC Tabs */}
            {isAdmin && (
              <div className="flex items-center space-x-1 pl-3 border-l border-gray-700/60 ml-2">
                <button
                  onClick={() => setActiveTab('soc')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition ${
                    activeTab === 'soc' 
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40' 
                      : 'text-gray-300 hover:text-white hover:bg-gray-800/60'
                  }`}
                  title="Security Operations Center"
                >
                  <ShieldAlert className="w-4 h-4 text-cyan-400" />
                  <span>SOC Center</span>
                </button>

                <button
                  onClick={() => setActiveTab('attacks')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition ${
                    activeTab === 'attacks' 
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40' 
                      : 'text-gray-300 hover:text-white hover:bg-gray-800/60'
                  }`}
                  title="Live Attack Monitor & Brute Force Detection"
                >
                  <Activity className="w-4 h-4 text-red-400" />
                  <span>Attack Monitor</span>
                </button>

                <button
                  onClick={() => setActiveTab('ip_management')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition ${
                    activeTab === 'ip_management' 
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' 
                      : 'text-gray-300 hover:text-white hover:bg-gray-800/60'
                  }`}
                  title="IP Blocking and Whitelisting"
                >
                  <Server className="w-4 h-4 text-orange-400" />
                  <span>IP Filter</span>
                </button>

                <button
                  onClick={() => setActiveTab('admin_challenges')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition ${
                    activeTab === 'admin_challenges' 
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                      : 'text-gray-300 hover:text-white hover:bg-gray-800/60'
                  }`}
                  title="Manage Challenges & Correct Flags"
                >
                  <Flag className="w-4 h-4 text-cyan-400" />
                  <span>Challenge Admin</span>
                </button>

                <button
                  onClick={() => setActiveTab('security_logs')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition ${
                    activeTab === 'security_logs' 
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40' 
                      : 'text-gray-300 hover:text-white hover:bg-gray-800/60'
                  }`}
                  title="SOC Security Audit Logs"
                >
                  <FileText className="w-4 h-4 text-purple-400" />
                  <span>Logs</span>
                </button>
              </div>
            )}
          </nav>

          {/* Right Section: Database Status & User Profile */}
          <div className="flex items-center space-x-4">
            
            {/* Database indicator */}
            <div 
              className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-mono border ${
                dbConnected 
                  ? 'bg-green-950/40 border-green-700/60 text-green-400' 
                  : 'bg-amber-950/40 border-amber-700/60 text-amber-300'
              }`}
              title={dbConnected ? "Connected to live MySQL database" : "Running on fallback demo dataset. To connect MySQL, import documentation/database_schema.sql"}
            >
              <Database className="w-3.5 h-3.5" />
              <span>{dbConnected ? 'MySQL Live' : 'Demo Mode'}</span>
            </div>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 bg-[#1F2937] hover:bg-gray-700/80 px-3 py-1.5 rounded-lg border border-gray-700 transition"
              >
                <div className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs ${
                  isAdmin ? 'bg-gradient-to-tr from-red-600 to-purple-600 text-white' : 'bg-gradient-to-tr from-cyan-600 to-blue-600 text-white'
                }`}>
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-medium text-white">{user?.username}</div>
                  <div className="text-[10px] font-mono text-cyan-400 uppercase">{user?.role}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#111827] border border-gray-700 rounded-lg shadow-2xl py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-800">
                    <p className="text-xs text-gray-400">Signed in as</p>
                    <p className="text-sm font-semibold text-white truncate">{user?.username}</p>
                    <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-gray-800 font-mono text-gray-300 uppercase">
                      Role: {user?.role}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center space-x-2 transition"
                  >
                    <LogOut className="w-4 h-4" />
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

