import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import ParticipantDashboard from './pages/ParticipantDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ChallengeExplorer from './pages/ChallengeExplorer';
import LeaderboardPage from './pages/LeaderboardPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import ChallengeManagementPage from './pages/ChallengeManagementPage';
import SystemMonitorPage from './pages/SystemMonitorPage';
import AccountsPage from './pages/AccountsPage';
import LoadingScreen from './components/LoadingScreen';
import SuspendedScreen from './components/SuspendedScreen';
import hnuLogo from './assets/hnu-logo.png';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dbConnected, setDbConnected] = useState(false);

  useEffect(() => {
    checkSession();
  }, []);

  // Poll participant session to reflect live admin suspensions / unsuspensions
  useEffect(() => {
    if (!user || user.role === 'admin') return;
    const poll = setInterval(async () => {
      const res = await api.me();
      if (res.status === 'authenticated' && res.user) {
        setUser(res.user);
      }
    }, 3000);
    return () => clearInterval(poll);
  }, [user?.id, user?.role]);

  const checkSession = async () => {
    setLoading(true);
    const res = await api.me();
    if (res.status === 'authenticated' && res.user) {
      setUser(res.user);
      setDbConnected(!!res.db_connected);
    } else {
      setUser(null);
      setDbConnected(!!res.db_connected);
    }
    setLoading(false);
  };

  const handleLoginSuccess = (userData) => {
    setIsLoggingIn(true);
    setUser(userData);
    setActiveTab(userData.role === 'admin' ? 'admin_dashboard' : 'dashboard');
    setTimeout(() => {
      setIsLoggingIn(false);
    }, 1200);
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setActiveTab('dashboard');
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  if (isLoggingIn) {
    return <LoadingScreen />;
  }

  const isAdmin = user.role === 'admin';

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-900">

      {/* Navbar */}
      <Navbar
        user={user}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dbConnected={dbConnected}
      />

      {/* Demo mode banner */}
      {!dbConnected && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs font-mono text-amber-900">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span>
                <strong>DEMO DATA MODE:</strong> MySQL database not yet imported. Run the queries in{' '}
                <code className="text-[#006633] font-bold">documentation/database_schema.sql</code> to connect live data.
              </span>
            </div>
            <span className="hidden sm:inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-100 border border-amber-300 text-amber-800">
              Setup Pending
            </span>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 bg-white">

        {/* ── Participant pages ──────────────────────────────────────────── */}
        {!isAdmin && activeTab === 'dashboard' && (
          <ParticipantDashboard
            user={user}
            onNavigateToChallenges={() => setActiveTab('challenges')}
            onNavigateToLeaderboard={() => setActiveTab('leaderboard')}
          />
        )}

        {activeTab === 'challenges' && !isAdmin && (
          <ChallengeExplorer user={user} isAdmin={false} />
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardPage currentUser={user} />
        )}

        {activeTab === 'announcements' && (
          <AnnouncementsPage user={user} isAdmin={isAdmin} />
        )}

        {/* ── Admin pages ────────────────────────────────────────────────── */}
        {isAdmin && activeTab === 'admin_dashboard' && (
          <AdminDashboard />
        )}

        {isAdmin && activeTab === 'admin_challenges' && (
          <ChallengeManagementPage />
        )}

        {isAdmin && activeTab === 'system_monitor' && (
          <SystemMonitorPage />
        )}

        {isAdmin && activeTab === 'accounts' && (
          <AccountsPage />
        )}

      </main>

      {/* Institutional HNU Green Footer with 3 Little Logos */}
      <footer className="bg-[#006633] border-t-2 border-[#eab308] py-6 text-white text-xs font-sans mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* 3 Little Logos */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-white/10 p-1 flex items-center justify-center border border-white/20">
              <img src={hnuLogo} alt="HNU Crest 1" className="w-full h-full object-contain brightness-110" />
            </div>
            <div className="w-8 h-8 rounded-full bg-white/10 p-1 flex items-center justify-center border border-white/20">
              <img src={hnuLogo} alt="HNU Crest 2" className="w-full h-full object-contain brightness-110" />
            </div>
            <div className="w-8 h-8 rounded-full bg-white/10 p-1 flex items-center justify-center border border-white/20">
              <img src={hnuLogo} alt="HNU Crest 3" className="w-full h-full object-contain brightness-110" />
            </div>
          </div>

          <div className="text-center sm:text-left">
            <span className="font-bold text-sm tracking-wide text-white block">Holy Name University</span>
            <span className="text-emerald-100 text-[11px] font-mono">Cybersecurity Challenge &amp; Competition Platform</span>
          </div>

          <div className="text-emerald-100 text-[11px] font-mono text-center sm:text-right">
            <span>&copy; {new Date().getFullYear()} HNU CTF • All rights reserved</span>
          </div>

        </div>
      </footer>

      {/* Participant Suspension Full-Screen Blur Overlay */}
      {!isAdmin && user?.is_suspended && (
        <SuspendedScreen
          initialRemainingSeconds={user.suspension_remaining}
          reason={user.suspension_reason}
          onCheckStatus={async () => {
            const res = await api.me();
            if (res.status === 'authenticated' && res.user) {
              setUser(res.user);
            }
          }}
        />
      )}

    </div>
  );
}
