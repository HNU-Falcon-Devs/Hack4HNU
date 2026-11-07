import React, { useState } from 'react';
import { ChevronDown, LogOut } from 'lucide-react';
import hnuLogo from '../assets/hnu-logo.png';

export default function Navbar({ user, onLogout, activeTab, setActiveTab, dbConnected }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const isAdmin = user?.role === 'admin';

  const teamDisplay = user?.team_name || (isAdmin ? 'Administrator' : 'Team Alpha');

  const navBtn = (tab, label) => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      className={`px-4 h-16 text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${
        activeTab === tab
          ? 'border-[#10B981] text-[#10B981]'
          : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
      }`}
    >
      {label}
    </button>
  );

  const participantTabs = [
    { tab: 'dashboard', label: 'Dashboard' },
    { tab: 'challenges', label: 'Challenges' },
    { tab: 'leaderboard', label: 'Team Scores' },
    { tab: 'announcements', label: 'Announcements' },
  ];

  const adminTabs = [
    { tab: 'admin_dashboard', label: 'Dashboard' },
    { tab: 'admin_challenges', label: 'Challenges' },
    { tab: 'leaderboard', label: 'Scores' },
    { tab: 'announcements', label: 'Announcements' },
    { tab: 'system_monitor', label: 'System' },
    { tab: 'accounts', label: 'Accounts' },
  ];

  const tabs = isAdmin ? adminTabs : participantTabs;

  return (
    <header className="bg-[#161c2d] border-b border-[#242f44] sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <div
            className="flex items-center space-x-3 cursor-pointer shrink-0"
            onClick={() => setActiveTab(isAdmin ? 'admin_dashboard' : 'dashboard')}
          >
            <img src={hnuLogo} alt="HNU Logo" className="w-9 h-9 object-contain" />
            <span className="font-black italic text-2xl tracking-tighter text-[#F59E0B]">
              HNU <span className="text-[#10B981]">CTF</span>
            </span>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center h-full overflow-x-auto">
            {tabs.map(({ tab, label }) => navBtn(tab, label))}
          </nav>

          {/* Profile */}
          <div className="relative shrink-0">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-2.5 bg-[#101522] hover:bg-[#1a2234] px-3 py-1.5 rounded-full border border-[#242f44] transition shadow-md"
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                isAdmin
                  ? 'bg-gradient-to-tr from-amber-600 to-amber-400 text-white'
                  : 'bg-gradient-to-tr from-[#059669] to-[#10B981] text-white'
              }`}>
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-white">{user?.username}</div>
                <div className="text-[10px] font-mono text-[#F59E0B] leading-none">
                  {isAdmin ? 'Administrator' : `Team: ${teamDisplay}`}
                </div>
              </div>
              <span className="text-gray-400 text-xs">▾</span>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-[#1a2234] border border-[#26334a] rounded-xl shadow-2xl py-1 z-50">
                <div className="px-4 py-2 border-b border-[#26334a]">
                  <p className="text-[11px] text-gray-400">Signed in as</p>
                  <p className="text-sm font-bold text-white truncate">{user?.username}</p>
                  <p className="text-xs text-[#F59E0B] font-mono font-medium truncate mt-0.5">
                    {isAdmin ? 'Administrator' : `Team: ${teamDisplay}`}
                  </p>
                  <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-[#101522] border border-[#26334a] font-mono text-emerald-400 uppercase">
                    {user?.role}
                  </span>
                </div>
                <button
                  onClick={() => { setDropdownOpen(false); onLogout(); }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 flex items-center space-x-2 transition"
                >
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
