import React, { useEffect, useState } from 'react';
import { 
  ShieldAlert, Activity, Users, Flag, AlertTriangle, ShieldCheck, 
  Server, Clock, ArrowRight, RefreshCw, BarChart3, PieChart as PieIcon
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  BarChart, Bar, PieChart, Pie, Cell, Legend, LineChart, Line 
} from 'recharts';
import { api } from '../services/api';

export default function SocDashboard({ onNavigateToTab }) {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSocData();
  }, []);

  const loadSocData = async () => {
    setLoading(true);
    const [statsRes, chartsRes] = await Promise.all([
      api.getSocStats(),
      api.getSocCharts()
    ]);

    if (statsRes.status === 'success') setStats(statsRes.stats);
    if (chartsRes.status === 'success') setCharts(chartsRes.charts);
    setLoading(false);
  };

  const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6'];

  return (
    <div className="space-y-6">
      
      {/* SOC Top Header */}
      <div className="bg-[#1a2234] border border-[#26334a] rounded-2xl p-6 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-red-950/80 border border-red-800/80 rounded-xl text-red-400 shadow-lg shadow-red-950/50">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black text-white tracking-tight font-mono">
                Security Operations Center (SOC)
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-950 border border-red-800 text-red-400 animate-pulse">
                LIVE TELEMETRY
              </span>
            </div>
            <p className="text-xs text-gray-400 font-mono">
              Real-time attack telemetry, brute-force anomalies, and participant behavior monitoring.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadSocData}
            disabled={loading}
            className="px-3.5 py-2 bg-[#121722] hover:bg-[#202b3d] border border-[#26334a] text-gray-300 rounded-xl text-xs font-mono flex items-center space-x-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>

          <button
            onClick={() => onNavigateToTab('attacks')}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 transition shadow-lg shadow-red-600/20"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Live Attack Feed</span>
          </button>
        </div>
      </div>

      {/* 8 Key Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 font-mono">
        
        {/* Total Participants */}
        <div className="bg-[#1a2234] border border-[#26334a] rounded-xl p-3 shadow-md">
          <div className="text-[10px] uppercase text-gray-400 truncate">Total Competitors</div>
          <div className="text-xl font-bold text-white mt-1">{stats?.total_participants ?? 0}</div>
        </div>

        {/* Active Participants */}
        <div className="bg-[#1a2234] border border-[#26334a] rounded-xl p-3 shadow-md">
          <div className="text-[10px] uppercase text-gray-400 truncate">Active (24h)</div>
          <div className="text-xl font-bold text-[#10B981] mt-1">{stats?.active_participants ?? 0}</div>
        </div>

        {/* Total Submissions */}
        <div className="bg-[#1a2234] border border-[#26334a] rounded-xl p-3 shadow-md">
          <div className="text-[10px] uppercase text-gray-400 truncate">Total Guesses</div>
          <div className="text-xl font-bold text-white mt-1">{stats?.total_submissions ?? 0}</div>
        </div>

        {/* Correct Submissions */}
        <div className="bg-[#1a2234] border border-[#26334a] rounded-xl p-3 shadow-md">
          <div className="text-[10px] uppercase text-gray-400 truncate">Correct Flags</div>
          <div className="text-xl font-bold text-[#10B981] mt-1">{stats?.correct_submissions ?? 0}</div>
        </div>

        {/* Incorrect Submissions */}
        <div className="bg-[#1a2234] border border-[#26334a] rounded-xl p-3 shadow-md">
          <div className="text-[10px] uppercase text-gray-400 truncate">Incorrect Flags</div>
          <div className="text-xl font-bold text-red-400 mt-1">{stats?.incorrect_submissions ?? 0}</div>
        </div>

        {/* Suspicious IPs */}
        <div className="bg-[#1a2234] border border-[#26334a] rounded-xl p-3 shadow-md">
          <div className="text-[10px] uppercase text-gray-400 truncate">Flagged IPs</div>
          <div className="text-xl font-bold text-[#F59E0B] mt-1">{stats?.suspicious_ips ?? 0}</div>
        </div>

        {/* Detected Brute-Force */}
        <div className="bg-[#1a2234] border border-[#26334a] rounded-xl p-3 shadow-md">
          <div className="text-[10px] uppercase text-gray-400 truncate">Brute Detections</div>
          <div className="text-xl font-bold text-red-500 mt-1">{stats?.detected_brute_force ?? 0}</div>
        </div>

        {/* Active Suspicious Activity */}
        <div className="bg-[#1a2234] border border-red-900/60 bg-red-950/20 rounded-xl p-3 shadow-md">
          <div className="text-[10px] uppercase text-red-300 truncate">Active Alerts</div>
          <div className="text-xl font-bold text-red-400 mt-1">{stats?.active_suspicious_activity ?? 0}</div>
        </div>

      </div>

      {/* 6 Interactive Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Successful vs Failed Submissions */}
        <div className="bg-[#1a2234] border border-[#26334a] rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#26334a]">
            <h2 className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center space-x-2">
              <PieIcon className="w-4 h-4 text-[#10B981]" />
              <span>Flag Accuracy (Successful vs Failed)</span>
            </h2>
            <span className="text-[11px] text-gray-500 font-mono">Cumulative</span>
          </div>

          <div className="h-64">
            {charts?.success_vs_failed ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.success_vs_failed}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {charts.success_vs_failed.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#121722', borderColor: '#26334a', borderRadius: '12px', color: '#fff', fontSize: '12px', fontFamily: 'monospace' }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '12px', fontFamily: 'monospace' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-500 font-mono">No data</div>
            )}
          </div>
        </div>

        {/* Chart 2: Submissions Over Time */}
        <div className="bg-[#1a2234] border border-[#26334a] rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#26334a]">
            <h2 className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center space-x-2">
              <Activity className="w-4 h-4 text-[#10B981]" />
              <span>Submission Volume Timeline</span>
            </h2>
            <span className="text-[11px] text-gray-500 font-mono">Hourly</span>
          </div>

          <div className="h-64">
            {charts?.submissions_over_time ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.submissions_over_time}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="hour_label" stroke="#475569" fontSize={11} fontFamily="monospace" />
                  <YAxis stroke="#475569" fontSize={11} fontFamily="monospace" />
                  <Tooltip contentStyle={{ backgroundColor: '#121722', borderColor: '#26334a', borderRadius: '12px', fontSize: '12px', fontFamily: 'monospace' }} />
                  <Area type="monotone" dataKey="total" name="Total Attempts" stroke="#10B981" fillOpacity={1} fill="url(#colorTotal)" />
                  <Area type="monotone" dataKey="incorrect" name="Incorrect" stroke="#EF4444" fillOpacity={1} fill="url(#colorFailed)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-500 font-mono">No data</div>
            )}
          </div>
        </div>

        {/* Chart 3: Top Suspicious IP Addresses */}
        <div className="bg-[#1a2234] border border-[#26334a] rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#26334a]">
            <h2 className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center space-x-2">
              <Server className="w-4 h-4 text-red-400" />
              <span>Top Suspicious IP Addresses (Failed Guesses)</span>
            </h2>
            <span className="text-[11px] text-red-400 font-mono">High Risk</span>
          </div>

          <div className="h-64">
            {charts?.top_suspicious_ips ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.top_suspicious_ips} layout="vertical">
                  <XAxis type="number" stroke="#475569" fontSize={11} fontFamily="monospace" />
                  <YAxis type="category" dataKey="ip_address" stroke="#475569" fontSize={11} fontFamily="monospace" width={110} />
                  <Tooltip contentStyle={{ backgroundColor: '#121722', borderColor: '#26334a', borderRadius: '12px', fontSize: '12px', fontFamily: 'monospace' }} />
                  <Bar dataKey="failed_attempts" name="Failed Attempts" fill="#EF4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-500 font-mono">No data</div>
            )}
          </div>
        </div>

        {/* Chart 4: Most Targeted Challenges */}
        <div className="bg-[#1a2234] border border-[#26334a] rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#26334a]">
            <h2 className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center space-x-2">
              <Flag className="w-4 h-4 text-[#F59E0B]" />
              <span>Most Targeted Challenges</span>
            </h2>
            <span className="text-[11px] text-gray-500 font-mono">Brute-Force Targets</span>
          </div>

          <div className="h-64">
            {charts?.most_targeted_challenges ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.most_targeted_challenges}>
                  <XAxis dataKey="name" stroke="#475569" fontSize={10} fontFamily="monospace" tickFormatter={(v) => v.slice(0, 10) + '...'} />
                  <YAxis stroke="#475569" fontSize={11} fontFamily="monospace" />
                  <Tooltip contentStyle={{ backgroundColor: '#121722', borderColor: '#26334a', borderRadius: '12px', fontSize: '12px', fontFamily: 'monospace' }} />
                  <Bar dataKey="attempts" name="Total Attempts" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="failed_attempts" name="Failed Guesses" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-500 font-mono">No data</div>
            )}
          </div>
        </div>

        {/* Chart 5: Most Active Participants */}
        <div className="bg-[#1a2234] border border-[#26334a] rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#26334a]">
            <h2 className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center space-x-2">
              <Users className="w-4 h-4 text-[#F59E0B]" />
              <span>Most Active Participants</span>
            </h2>
            <span className="text-[11px] text-gray-500 font-mono">By Submissions</span>
          </div>

          <div className="h-64">
            {charts?.most_active_participants ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.most_active_participants}>
                  <XAxis dataKey="username" stroke="#475569" fontSize={11} fontFamily="monospace" />
                  <YAxis stroke="#475569" fontSize={11} fontFamily="monospace" />
                  <Tooltip contentStyle={{ backgroundColor: '#121722', borderColor: '#26334a', borderRadius: '12px', fontSize: '12px', fontFamily: 'monospace' }} />
                  <Bar dataKey="submissions_count" name="Submissions Count" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-500 font-mono">No data</div>
            )}
          </div>
        </div>

        {/* Chart 6: Failed Submissions by Hour */}
        <div className="bg-[#1a2234] border border-[#26334a] rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#26334a]">
            <h2 className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center space-x-2">
              <Clock className="w-4 h-4 text-[#F59E0B]" />
              <span>Failed Submissions by Hour (Attack Spikes)</span>
            </h2>
            <span className="text-[11px] text-gray-500 font-mono">24h Pattern</span>
          </div>

          <div className="h-64">
            {charts?.failed_by_hour ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.failed_by_hour}>
                  <XAxis dataKey="hour" stroke="#475569" fontSize={11} fontFamily="monospace" />
                  <YAxis stroke="#475569" fontSize={11} fontFamily="monospace" />
                  <Tooltip contentStyle={{ backgroundColor: '#121722', borderColor: '#26334a', borderRadius: '12px', fontSize: '12px', fontFamily: 'monospace' }} />
                  <Line type="monotone" dataKey="failed_count" name="Failed Submissions" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-500 font-mono">No data</div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
