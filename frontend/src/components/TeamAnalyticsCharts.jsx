import React from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, Legend
} from 'recharts';

export default function TeamAnalyticsCharts({ charts }) {
  const rawList = charts?.success_vs_failed || [];
  const successfulCount = Number(rawList.find(d => d.name === 'Successful')?.value ?? 0);
  const failedCount = Number(rawList.find(d => d.name === 'Failed')?.value ?? 0);
  const totalSubmissions = successfulCount + failedCount;

  const hasSubmissions = totalSubmissions > 0;
  const pieData = hasSubmissions
    ? [
      { name: 'Successful', value: successfulCount, fill: '#006633' },
      { name: 'Failed', value: failedCount, fill: '#ef4444' }
    ]
    : [
      { name: 'No Attempts', value: 1, fill: '#e2e8f0' }
    ];

  const timeline = Array.isArray(charts?.submissions_over_time) ? charts.submissions_over_time : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* Chart 1: FLAG ACCURACY */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center space-x-2">
              <span>FLAG ACCURACY (SUCCESSFUL VS FAILED)</span>
            </h2>
          </div>
        </div>

        <div className="h-64 relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={86}
                paddingAngle={hasSubmissions ? 4 : 0}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.fill || (entry.name === 'Successful' ? '#006633' : '#ef4444')}
                  />
                ))}
              </Pie>
              {hasSubmissions && (
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '0.75rem',
                    color: '#0f172a',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                  }}
                />
              )}
              {hasSubmissions && (
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', color: '#64748b' }}
                />
              )}
            </PieChart>
          </ResponsiveContainer>

          {!hasSubmissions && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-4">
              <span className="text-xs font-mono font-bold text-slate-700">0 Submissions</span>
              <span className="text-[10px] text-slate-400 font-sans mt-0.5">Awaiting first flag attempt</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-center font-mono">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase block">Successful Solves</span>
            <span className="text-lg font-bold text-[#006633]">
              {successfulCount}
            </span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase block">Failed Submissions</span>
            <span className="text-lg font-bold text-rose-600">
              {failedCount}
            </span>
          </div>
        </div>
      </div>

      {/* Chart 2: SUBMISSION VOLUME TIMELINE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center space-x-2">
              <span>SUBMISSION VOLUME TIMELINE</span>
            </h2>
          </div>
        </div>

        <div className="h-64">
          {timeline.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#006633" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#006633" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorCorrect" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#eab308" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#eab308" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="hour_label"
                  stroke="#94a3b8"
                  fontSize={10}
                  fontFamily="monospace"
                  tickLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={10}
                  fontFamily="monospace"
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '0.75rem',
                    color: '#0f172a',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  name="Total Submissions"
                  stroke="#006633"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                />
                <Area
                  type="monotone"
                  dataKey="correct"
                  name="Correct Solves"
                  stroke="#eab308"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCorrect)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-1.5 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <span className="text-xs font-mono font-bold text-slate-700">No Submission Activity Yet</span>
              <span className="text-[11px] text-slate-400 font-sans max-w-xs">
                As you and your 3 teammates test flags, hourly volume and solve milestones will plot here in real time.
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-xs font-mono text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#006633]" />
            <span>Total Attempts</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#eab308]" />
            <span>Correct Flags</span>
          </div>
        </div>
      </div>

    </div>
  );
}
