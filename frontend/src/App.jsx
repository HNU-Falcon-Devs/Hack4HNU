import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import ParticipantDashboard from './pages/ParticipantDashboard';
import ChallengeExplorer from './pages/ChallengeExplorer';
import LeaderboardPage from './pages/LeaderboardPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import SocDashboard from './pages/SocDashboard';
import AttackMonitorPage from './pages/AttackMonitorPage';
import IpManagementPage from './pages/IpManagementPage';
import ChallengeManagementPage from './pages/ChallengeManagementPage';
import SecurityLogsPage from './pages/SecurityLogsPage';
import { Database, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dbConnected, setDbConnected] = useState(false);

  useEffect(() => {
    checkSession();
  }, []);

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
    setUser(userData);
    setActiveTab(userData.role === 'admin' ? 'soc' : 'dashboard');
    checkSession();
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setActiveTab('dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121722] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        <div className="font-mono text-xs text-emerald-400 tracking-wider uppercase">
          Initializing HNU CTF Security Gateway...
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const isAdmin = user.role === 'admin';

  return (
    <div className="min-h-screen bg-[#121722] text-[#F1F5F9] flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      
      {/* Top Navbar */}
      <Navbar
        user={user}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dbConnected={dbConnected}
      />

      {/* Database Setup Notice Banner (Visible only when MySQL is not yet configured) */}
      {!dbConnected && (
        <div className="bg-amber-950/60 border-b border-amber-800/80 px-4 py-2 text-xs font-mono text-amber-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>DEMO DATA MODE:</strong> MySQL database not yet imported. The platform is running with interactive demo data and original challenge files. To connect your live MySQL, run the queries in <code className="text-cyan-300 font-bold">documentation/database_schema.sql</code>.
              </span>
            </div>
            <span className="hidden sm:inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-900 border border-amber-700">
              Setup Pending
            </span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {activeTab === 'dashboard' && (
          <ParticipantDashboard 
            user={user}
            onNavigateToChallenges={() => setActiveTab('challenges')}
            onNavigateToLeaderboard={() => setActiveTab('leaderboard')}
          />
        )}

        {activeTab === 'challenges' && (
          <ChallengeExplorer 
            user={user}
            isAdmin={isAdmin}
          />
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardPage 
            currentUser={user}
          />
        )}

        {activeTab === 'announcements' && (
          <AnnouncementsPage 
            user={user}
            isAdmin={isAdmin}
          />
        )}

        {/* Admin SOC Tabs */}
        {isAdmin && activeTab === 'soc' && (
          <SocDashboard 
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        )}

        {isAdmin && activeTab === 'attacks' && (
          <AttackMonitorPage />
        )}

        {isAdmin && activeTab === 'ip_management' && (
          <IpManagementPage />
        )}

        {isAdmin && activeTab === 'admin_challenges' && (
          <ChallengeManagementPage />
        )}

        {isAdmin && activeTab === 'security_logs' && (
          <SecurityLogsPage />
        )}

      </main>

      {/* Sleek Footer */}
      <footer className="bg-[#0e131d] border-t border-[#1e2638] py-4 text-center text-xs font-sans text-gray-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-gray-300">HNU CTF</span>
            <span className="text-gray-600">•</span>
            <span className="text-emerald-400 font-medium">Holy Name University</span>
          </div>
          <div className="text-gray-400 text-[11px] font-mono">
            PHP 8 & ReactJS • Active Arena
          </div>
        </div>
      </footer>

    </div>
  );
}

