import React, { useEffect, useState } from 'react';
import { 
  FileText, Search, Filter, ShieldAlert, Calendar, RefreshCw, 
  ChevronLeft, ChevronRight, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';

const EVENT_TYPES = [
  'ALL',
  'FLAG_ATTEMPT_FAILED',
  'FLAG_ATTEMPT_SUCCESS',
  'BRUTE_FORCE_SUSPICIOUS',
  'BRUTE_FORCE_HIGH_RISK',
  'BRUTE_FORCE_CRITICAL',
  'RATE_LIMITED',
  'IP_BLOCKED_ACCESS',
  'AUTH_FAILED',
  'AUTH_SUCCESS',
  'ADMIN_ACTION'
];

const THREAT_LEVELS = ['ALL', 'Low', 'Medium', 'High', 'Critical'];

export default function SecurityLogsPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [eventType, setEventType] = useState('ALL');
  const [threatLevel, setThreatLevel] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, [page, limit, eventType, threatLevel, startDate, endDate]);

  const loadLogs = async () => {
    setLoading(true);
    const params = {
      page,
      limit,
      search: search.trim(),
      event_type: eventType,
      threat_level: threatLevel,
      start_date: startDate,
      end_date: endDate
    };

    const res = await api.getSecurityLogs(params);
    if (res.status === 'success' && res.logs) {
      setLogs(res.logs);
      setTotal(res.total || res.logs.length);
      setTotalPages(res.total_pages || 1);
    }
    setLoading(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadLogs();
  };

  const getThreatBadge = (level) => {
    switch (level) {
      case 'Critical': return 'text-red-400 bg-red-950/80 border-red-800 font-bold';
      case 'High': return 'text-orange-400 bg-orange-950/80 border-orange-800 font-bold';
      case 'Medium': return 'text-amber-400 bg-amber-950/80 border-amber-800';
      default: return 'text-green-400 bg-green-950/80 border-green-800';
    }
  };

  const getResultBadge = (result) => {
    switch (result) {
      case 'CORRECT': return 'text-green-400 font-bold';
      case 'INCORRECT': return 'text-red-400 font-bold';
      case 'TRIGGERED': return 'text-orange-400 font-bold';
      case 'BLOCKED': return 'text-red-500 font-extrabold';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-purple-950/80 border border-purple-800/80 rounded-xl text-purple-400 shadow-lg shadow-purple-950/50">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight font-mono">
              SOC Security Incident & Audit Logs
            </h1>
            <p className="text-xs text-gray-400 font-mono">
              Comprehensive telemetry for flag attempts, brute-force anomalies, and firewall interventions.
            </p>
          </div>
        </div>

        <button
          onClick={loadLogs}
          disabled={loading}
          className="px-3.5 py-2 bg-[#080D18] hover:bg-gray-800 border border-gray-700 text-gray-300 rounded-lg text-xs font-mono flex items-center space-x-1.5 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5 shadow-sm space-y-3 font-mono text-xs">
        
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              <Search className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user, IP, challenge, or reason..."
              className="w-full bg-[#080D18] border border-gray-700 rounded-lg pl-8 pr-3 py-2 text-white placeholder-gray-500 focus:border-cyan-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Event Filter */}
            <select
              value={eventType}
              onChange={(e) => { setEventType(e.target.value); setPage(1); }}
              className="bg-[#080D18] border border-gray-700 rounded-lg px-2.5 py-2 text-gray-300 focus:border-cyan-400 text-xs"
            >
              {EVENT_TYPES.map(t => (
                <option key={t} value={t}>Event: {t}</option>
              ))}
            </select>

            {/* Threat Level */}
            <select
              value={threatLevel}
              onChange={(e) => { setThreatLevel(e.target.value); setPage(1); }}
              className="bg-[#080D18] border border-gray-700 rounded-lg px-2.5 py-2 text-gray-300 focus:border-cyan-400 text-xs"
            >
              {THREAT_LEVELS.map(l => (
                <option key={l} value={l}>Threat: {l}</option>
              ))}
            </select>

            {/* Date Pickers */}
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="bg-[#080D18] border border-gray-700 rounded-lg px-2 py-1.5 text-gray-300 focus:border-cyan-400 text-xs"
              title="Start Date"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="bg-[#080D18] border border-gray-700 rounded-lg px-2 py-1.5 text-gray-300 focus:border-cyan-400 text-xs"
              title="End Date"
            />

            <button
              type="submit"
              className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition"
            >
              Filter
            </button>
          </div>
        </form>

      </div>

      {/* Logs Table */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0B1120] text-gray-400 border-b border-gray-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3.5">Timestamp</th>
                <th className="px-4 py-3.5">Participant</th>
                <th className="px-4 py-3.5">Source IP</th>
                <th className="px-4 py-3.5">Target Challenge</th>
                <th className="px-4 py-3.5">Event Classification</th>
                <th className="px-4 py-3.5">Result</th>
                <th className="px-4 py-3.5">Threat Level</th>
                <th className="px-4 py-3.5">SOC Detection Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/80">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-gray-400">
                    Querying SOC logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-gray-500">
                    No security events found matching the criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-800/30 transition">
                    <td className="px-4 py-3.5 text-gray-400 whitespace-nowrap text-[11px]">{log.created_at}</td>
                    <td className="px-4 py-3.5 text-white font-bold whitespace-nowrap">{log.username || 'System / Unauth'}</td>
                    <td className="px-4 py-3.5 text-cyan-300 font-bold whitespace-nowrap">{log.ip_address}</td>
                    <td className="px-4 py-3.5 text-gray-300 whitespace-nowrap">{log.challenge_name || 'N/A'}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[#080D18] border border-gray-800 text-purple-300">
                        {log.event_type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-[11px]">
                      <span className={getResultBadge(log.result)}>
                        {log.result}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase border ${getThreatBadge(log.threat_level)}`}>
                        {log.threat_level}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-300 max-w-sm truncate" title={log.detection_reason}>
                      {log.detection_reason}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-5 py-3 border-t border-gray-800 bg-[#0B1120] flex items-center justify-between font-mono text-xs text-gray-400">
          <div>
            Showing Page <span className="text-white font-bold">{page}</span> of <span className="text-white font-bold">{totalPages}</span> ({total} total entries)
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded bg-gray-800 hover:bg-gray-700 text-white disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded bg-gray-800 hover:bg-gray-700 text-white disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}

