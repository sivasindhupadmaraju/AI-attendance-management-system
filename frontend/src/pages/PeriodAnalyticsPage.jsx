import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Calendar, Filter, Users, CheckCircle2, AlertTriangle, XCircle, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { reportApi } from '../api/reportApi';
import { useAuth } from '../context/AuthContext';

const PeriodAnalyticsPage = () => {
  const { user } = useAuth();
  const [periodData, setPeriodData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [department, setDepartment] = useState('');

  const fetchPeriodData = async () => {
    setIsLoading(true);
    try {
      const data = await reportApi.getPeriodSummary(selectedDate, department || null);
      setPeriodData(data);
    } catch (error) {
      console.error('Failed to fetch period summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPeriodData();
  }, [selectedDate, department]);

  // Navigate date by +/- 1
  const shiftDate = (direction) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + direction);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  // Compute aggregate stats
  const aggregateStats = useMemo(() => {
    if (!periodData?.periods) return { totalPresent: 0, totalLate: 0, totalAbsent: 0, avgRate: 0, bestPeriod: '-', worstPeriod: '-' };
    const periods = periodData.periods;
    const totalPresent = periods.reduce((s, p) => s + p.present, 0);
    const totalLate = periods.reduce((s, p) => s + p.late, 0);
    const totalAbsent = periods.reduce((s, p) => s + p.absent, 0);
    const avgRate = periods.length > 0 ? Math.round(periods.reduce((s, p) => s + p.attendance_rate, 0) / periods.length * 10) / 10 : 0;
    const sorted = [...periods].sort((a, b) => b.attendance_rate - a.attendance_rate);
    const bestPeriod = sorted[0]?.period || '-';
    const worstPeriod = sorted[sorted.length - 1]?.period || '-';
    return { totalPresent, totalLate, totalAbsent, avgRate, bestPeriod, worstPeriod };
  }, [periodData]);

  // Radial progress ring component
  const RadialProgress = ({ value, size = 52, stroke = 5, color }) => {
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;
    return (
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-slate-800/60" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700 ease-out" />
      </svg>
    );
  };

  // Colour helpers
  const rateColor = (rate) => rate >= 75 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#ef4444';
  const rateTextClass = (rate) => rate >= 75 ? 'text-emerald-400' : rate >= 50 ? 'text-amber-400' : 'text-rose-400';
  const rateBgClass = (rate) => rate >= 75 ? 'bg-emerald-500/10 border-emerald-500/20' : rate >= 50 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-rose-500/10 border-rose-500/20';

  const formattedDate = useMemo(() => {
    const d = new Date(selectedDate + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }, [selectedDate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-outfit text-white">Period-wise Attendance</h1>
          <p className="text-xs text-slate-500 mt-0.5">Hourly biometric analysis across all class periods for any day.</p>
        </div>
      </div>

      {/* Date Navigator + Department Filter */}
      <div className="bg-slate-900/35 border border-slate-800 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Date Picker with Nav */}
          <div className="flex items-center gap-2">
            <button onClick={() => shiftDate(-1)} className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-brand-500/40 text-slate-400 hover:text-white transition-all">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-500 pointer-events-none" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-9 pr-3 py-2 bg-slate-950/60 border border-slate-850 focus:border-brand-500 rounded-xl text-xs outline-none text-slate-300 transition-all w-[170px]"
              />
            </div>
            <button onClick={() => shiftDate(1)} className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-brand-500/40 text-slate-400 hover:text-white transition-all">
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setSelectedDate(new Date().toISOString().slice(0, 10))}
              className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-brand-400 bg-brand-500/10 border border-brand-500/20 hover:bg-brand-500/20 rounded-xl transition-all"
            >
              Today
            </button>
          </div>

          {/* Separator */}
          <div className="hidden sm:block h-8 w-px bg-slate-800"></div>

          {/* Department Filter (hidden for teachers) */}
          {user?.role !== 'teacher' && (
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-slate-500" />
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="bg-slate-950/60 border border-slate-850 focus:border-brand-500 px-3 py-2 rounded-xl text-xs outline-none text-slate-300 transition-all"
              >
                <option value="">All Departments</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Electronics">Electronics</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Civil Engineering">Civil Engineering</option>
                <option value="Information Technology">Information Technology</option>
              </select>
            </div>
          )}

          {/* Date Display */}
          <div className="sm:ml-auto text-xs text-slate-400 font-medium">{formattedDate}</div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-brand-500 border-t-transparent"></div>
        </div>
      )}

      {!isLoading && periodData && (
        <>
          {/* Aggregate KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Enrolled', value: periodData.total_students, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
              { label: 'Avg Rate', value: `${aggregateStats.avgRate}%`, icon: TrendingUp, color: rateTextClass(aggregateStats.avgRate), bg: rateBgClass(aggregateStats.avgRate) },
              { label: 'Total Present', value: aggregateStats.totalPresent, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
              { label: 'Total Late', value: aggregateStats.totalLate, icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
              { label: 'Total Absent', value: aggregateStats.totalAbsent, icon: XCircle, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
              { label: 'Best Period', value: aggregateStats.bestPeriod.replace(/Period \d+ /, ''), icon: Clock, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
            ].map((kpi, i) => (
              <div key={i} className="bg-slate-900/30 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2">
                <div className={`p-2 w-fit rounded-xl border ${kpi.bg}`}>
                  <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
                <p className="text-lg font-bold font-outfit text-white leading-tight">{kpi.value}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{kpi.label}</p>
              </div>
            ))}
          </div>

          {/* Period Heatmap Bar Visualization */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold font-outfit text-white">Period Attendance Heatmap</h2>
                <p className="text-xs text-slate-500 mt-0.5">Hourly breakdown — each bar represents one class period.</p>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span><span className="text-slate-400">Present</span></span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span><span className="text-slate-400">Late</span></span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-slate-700"></span><span className="text-slate-400">Absent</span></span>
              </div>
            </div>

            <div className="space-y-3">
              {periodData.periods.map((p) => {
                const total = p.total || 1;
                const presentPct = (p.present / total * 100);
                const latePct = (p.late / total * 100);
                const absentPct = (p.absent / total * 100);
                return (
                  <div key={p.period_id} className="group">
                    <div className="flex items-center gap-4">
                      {/* Period Label */}
                      <div className="w-[180px] flex-shrink-0">
                        <p className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">{p.period}</p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {p.start.substring(0, 5)} — {p.end.substring(0, 5)}
                        </p>
                      </div>

                      {/* Stacked Bar */}
                      <div className="flex-1 h-8 bg-slate-850 rounded-lg overflow-hidden flex relative group-hover:shadow-lg group-hover:shadow-brand-500/5 transition-shadow">
                        {presentPct > 0 && (
                          <div
                            className="bg-emerald-500/80 h-full transition-all duration-700 ease-out flex items-center justify-center"
                            style={{ width: `${presentPct}%` }}
                          >
                            {presentPct > 12 && <span className="text-[10px] font-bold text-white/90">{p.present}</span>}
                          </div>
                        )}
                        {latePct > 0 && (
                          <div
                            className="bg-amber-500/80 h-full transition-all duration-700 ease-out flex items-center justify-center"
                            style={{ width: `${latePct}%` }}
                          >
                            {latePct > 12 && <span className="text-[10px] font-bold text-white/90">{p.late}</span>}
                          </div>
                        )}
                        {absentPct > 0 && (
                          <div
                            className="bg-slate-700/80 h-full transition-all duration-700 ease-out flex items-center justify-center"
                            style={{ width: `${absentPct}%` }}
                          >
                            {absentPct > 12 && <span className="text-[10px] font-bold text-slate-400">{p.absent}</span>}
                          </div>
                        )}
                      </div>

                      {/* Rate Badge */}
                      <div className={`w-[60px] text-right`}>
                        <span className={`text-sm font-bold font-outfit ${rateTextClass(p.attendance_rate)}`}>{p.attendance_rate}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Per-Period Detail Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {periodData.periods.map((p) => (
              <div
                key={p.period_id}
                className="bg-slate-900/30 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col gap-4 transition-all duration-200 hover:shadow-lg hover:shadow-brand-500/5 group"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-brand-400 transition-colors">{p.period}</h3>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                      {p.start.substring(0, 5)} — {p.end.substring(0, 5)}
                    </p>
                  </div>
                  {/* Radial Ring */}
                  <div className="relative flex items-center justify-center">
                    <RadialProgress value={p.attendance_rate} color={rateColor(p.attendance_rate)} />
                    <span className={`absolute text-[11px] font-bold font-outfit ${rateTextClass(p.attendance_rate)}`}>
                      {p.attendance_rate}%
                    </span>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-2.5 text-center">
                    <p className="text-sm font-bold font-outfit text-emerald-400">{p.present}</p>
                    <p className="text-[9px] font-bold text-emerald-500/60 uppercase tracking-wider mt-0.5">Present</p>
                  </div>
                  <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-2.5 text-center">
                    <p className="text-sm font-bold font-outfit text-amber-400">{p.late}</p>
                    <p className="text-[9px] font-bold text-amber-500/60 uppercase tracking-wider mt-0.5">Late</p>
                  </div>
                  <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-2.5 text-center">
                    <p className="text-sm font-bold font-outfit text-slate-300">{p.absent}</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Absent</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Empty State */}
      {!isLoading && !periodData && (
        <div className="text-center py-20">
          <Clock className="h-12 w-12 text-slate-700 mx-auto mb-4" />
          <p className="text-sm text-slate-400 font-semibold">No period data available</p>
          <p className="text-xs text-slate-500 mt-1">Select a date to view period-wise attendance analytics.</p>
        </div>
      )}
    </div>
  );
};

export default PeriodAnalyticsPage;
