import React from 'react';
import { 
  PieChart as PieIcon, Activity 
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  PieChart, Pie, Cell, Legend
} from 'recharts';

export default function TeamAnalyticsCharts({ charts }) {
  const defaultSuccessVsFailed = [
    { name: 'Successful', value: 48, fill: '#10B981' },
    { name: 'Failed', value: 94, fill: '#EF4444' }
  ];

  const defaultTimeline = [
    { hour_label: '14:00', total: 12, correct: 4, incorrect: 8 },
    { hour_label: '15:00', total: 25, correct: 10, incorrect: 15 },
    { hour_label: '16:00', total: 38, correct: 12, incorrect: 26 },
    { hour_label: '17:00', total: 18, correct: 5, incorrect: 13 },
    { hour_label: '18:00', total: 31, correct: 9, incorrect: 22 },
    { hour_label: '19:00', total: 18, correct: 8, incorrect: 10 }
  ];

  const successVsFailed = (charts?.success_vs_failed && charts.success_vs_failed.length > 0)
    ? charts.success_vs_failed
    : defaultSuccessVsFailed;

  const timeline = (charts?.submissions_over_time && charts.submissions_over_time.length > 0)
    ? charts.submissions_over_time
    : defaultTimeline;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Chart 1: FLAG ACCURACY (SUCCESSFUL VS FAILED) */}
      <div className="bg-[#1a2234] border border-[#26334a] rounded-2xl p-5 shadow-lg space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#26334a]">
          <h2 className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center space-x-2">
            <PieIcon className="w-4 h-4 text-[#10B981]" />
            <span>FLAG ACCURACY (SUCCESSFUL VS FAILED)</span>
          </h2>
          <span className="text-[11px] text-gray-500 font-mono">Cumulative</span>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={successVsFailed}
                cx="50%"
                cy="46%"
                innerRadius={60}
                outerRadius={86}
                paddingAngle={4}
                dataKey="value"
              >
                {successVsFailed.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.fill || (entry.name === 'Successful' ? '#10B981' : '#EF4444')} 
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#121722', 
                  borderColor: '#26334a', 
                  borderRadius: '12px', 
                  color: '#fff', 
                  fontSize: '12px', 
                  fontFamily: 'monospace' 
                }}
              />
              <Legend 
                verticalAlign="bottom"
                wrapperStyle={{ fontSize: '12px', fontFamily: 'monospace', paddingTop: '10px' }}
                formatter={(value) => <span className="text-gray-300 font-mono text-xs">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: SUBMISSION VOLUME TIMELINE */}
      <div className="bg-[#1a2234] border border-[#26334a] rounded-2xl p-5 shadow-lg space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#26334a]">
          <h2 className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center space-x-2">
            <Activity className="w-4 h-4 text-[#10B981]" />
            <span>SUBMISSION VOLUME TIMELINE</span>
          </h2>
          <span className="text-[11px] text-gray-500 font-mono">Hourly</span>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="chartColorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.45}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.02}/>
                </linearGradient>
                <linearGradient id="chartColorFailed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.45}/>
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0.02}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="hour_label" 
                stroke="#475569" 
                fontSize={11} 
                fontFamily="monospace"
                tickLine={false}
              />
              <YAxis 
                stroke="#475569" 
                fontSize={11} 
                fontFamily="monospace"
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#121722', 
                  borderColor: '#26334a', 
                  borderRadius: '12px', 
                  fontSize: '12px', 
                  fontFamily: 'monospace',
                  color: '#fff'
                }} 
              />
              <Area 
                type="monotone" 
                dataKey="total" 
                name="Total Submissions" 
                stroke="#10B981" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#chartColorTotal)" 
              />
              <Area 
                type="monotone" 
                dataKey="incorrect" 
                name="Incorrect Attempts" 
                stroke="#EF4444" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#chartColorFailed)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}

