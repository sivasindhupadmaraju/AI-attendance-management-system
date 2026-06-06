import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

const AttendanceChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
        No trend data available.
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-4 rounded-xl border border-slate-800 shadow-2xl text-xs">
          <p className="font-bold text-slate-300 mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-emerald-400 font-semibold">
              Present: <span className="text-white">{payload[0].value}</span>
            </p>
            <p className="text-amber-400 font-semibold">
              Late Arrivals: <span className="text-white">{payload[1].value}</span>
            </p>
            <p className="text-rose-400 font-semibold">
              Absent: <span className="text-white">{payload[2].value}</span>
            </p>
            <div className="border-t border-slate-800 my-1.5 pt-1.5">
              <p className="text-brand-400 font-bold">
                Rate: <span className="text-white">{payload[0].payload.attendance_rate}%</span>
              </p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
          <XAxis 
            dataKey="display_date" 
            stroke="#64748b" 
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#64748b" 
            fontSize={11}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
          <Legend 
            verticalAlign="top" 
            height={36} 
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
          />
          <Bar 
            name="Present" 
            dataKey="present" 
            stackId="a" 
            fill="#10b981" 
            radius={[0, 0, 0, 0]} 
          />
          <Bar 
            name="Late Arrivals" 
            dataKey="late" 
            stackId="a" 
            fill="#f59e0b" 
            radius={[0, 0, 0, 0]} 
          />
          <Bar 
            name="Absent" 
            dataKey="absent" 
            fill="#ef4444" 
            radius={[4, 4, 0, 0]} 
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AttendanceChart;
