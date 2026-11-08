/**
 * HNU CTF - API Client Service
 * Interacts with Native PHP backend endpoints with credentials and CORS support.
 */

// Dynamically determine the backend API base path
const getApiBase = () => {
  // If in Vite dev server (port 5173), proxy to /backend
  // If in XAMPP or production, use relative path to backend
  return '/backend/api';
};

const API_BASE = getApiBase();

async function request(endpoint, options = {}) {
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    credentials: 'include' // include session cookie
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    return {
      status: 'error',
      message: 'Failed to communicate with the HNU CTF backend server.'
    };
  }
}

export const api = {
  // Auth
  login: (username, password) => 
    request('/auth.php?action=login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    }),
  
  me: () => request('/auth.php?action=me'),
  
  logout: () => request('/auth.php?action=logout', { method: 'POST' }),

  // Challenges
  getChallenges: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/challenges.php?action=list&${query}`);
  },

  getChallengeSolvers: (id) => 
    request(`/challenges.php?action=solvers&id=${id}`),

  updateChallenge: (payload) =>
    request('/challenges.php?action=update', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  toggleChallenge: (id) =>
    request('/challenges.php?action=toggle', {
      method: 'POST',
      body: JSON.stringify({ id })
    }),

  getChallengeImageUrl: (slug) => `${API_BASE}/challenges.php?action=image&slug=${slug}`,

  getDownloadUrl: (id, slug, filename) => {
    if (id) {
      return `${API_BASE}/download.php?id=${id}`;
    }
    return `${API_BASE}/download.php?slug=${encodeURIComponent(slug)}&file=${encodeURIComponent(filename)}`;
  },

  // Submissions
  submitFlag: (challengeId, flag) =>
    request('/submissions.php?action=submit', {
      method: 'POST',
      body: JSON.stringify({ challenge_id: challengeId, flag })
    }),

  getSubmissionHistory: () =>
    request('/submissions.php?action=history'),

  // Leaderboard & Participant Dashboard
  getLeaderboard: () => request('/leaderboard.php'),
  
  getDashboard: () => request('/dashboard.php'),

  // SOC Monitoring & Brute Force Detection
  getSocStats: () => request('/monitoring.php?action=stats'),
  
  getSocCharts: () => request('/monitoring.php?action=charts'),
  
  getSocAttacks: () => request('/monitoring.php?action=attacks'),
  
  investigateIp: (ip) => request(`/monitoring.php?action=investigate_ip&ip=${encodeURIComponent(ip)}`),
  
  getSocThresholds: () => request('/monitoring.php?action=thresholds'),
  
  updateSocThresholds: (thresholds) =>
    request('/monitoring.php?action=thresholds', {
      method: 'POST',
      body: JSON.stringify(thresholds)
    }),

  // IP Management
  getIps: (filter = 'all') => request(`/ip_management.php?action=list&filter=${filter}`),
  
  manageIp: (action, payload) =>
    request(`/ip_management.php?action=${action}`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  
  getIpActionsHistory: () => request('/ip_management.php?action=history'),

  // Security Logs
  getSecurityLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/security_logs.php?${query}`);
  },

  // Announcements
  getAnnouncements: () => request('/announcements.php?action=list'),
  
  createAnnouncement: (payload) =>
    request('/announcements.php?action=create', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  
  deleteAnnouncement: (id) =>
    request('/announcements.php?action=delete', {
      method: 'POST',
      body: JSON.stringify({ id })
    }),

  // Challenges - Create & Delete
  createChallenge: (payload) =>
    request('/challenges.php?action=create', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  deleteChallenge: (id) =>
    request('/challenges.php?action=delete', {
      method: 'POST',
      body: JSON.stringify({ id })
    }),

  // Account Management
  getAccounts: () => request('/accounts.php?action=list'),

  createTeam: (payload) =>
    request('/accounts.php?action=create_team', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  createAccount: (payload) =>
    request('/accounts.php?action=create_account', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  deleteAccount: (id) =>
    request('/accounts.php?action=delete_account', {
      method: 'POST',
      body: JSON.stringify({ id })
    }),

  deleteTeam: (teamId) =>
    request('/accounts.php?action=delete_team', {
      method: 'POST',
      body: JSON.stringify({ team_id: teamId })
    }),

  suspendUser: (userId, minutes = 30, reason = '') =>
    request('/accounts.php?action=suspend_user', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, minutes, reason })
    }),

  unsuspendUser: (userId) =>
    request('/accounts.php?action=unsuspend_user', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId })
    }),

  suspendTeam: (teamId, minutes = 30, reason = '') =>
    request('/accounts.php?action=suspend_team', {
      method: 'POST',
      body: JSON.stringify({ team_id: teamId, minutes, reason })
    }),

  unsuspendTeam: (teamId) =>
    request('/accounts.php?action=unsuspend_team', {
      method: 'POST',
      body: JSON.stringify({ team_id: teamId })
    }),
};

