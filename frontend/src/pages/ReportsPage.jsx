import React, { useState, useEffect } from 'react';
import { Download, Calendar, Filter, BarChart3, TrendingUp, PieChart, ShieldAlert } from 'lucide-react';
import { reportApi } from '../api/reportApi';
import AttendanceChart from '../components/AttendanceChart';

const ReportsPage = () => {
  const [trends, setTrends] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  
  // Filter States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [department, setDepartment] = useState('');
  const [days, setDays] = useState(7); // default trends limit

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      const [summaryData, trendsData] = await Promise.all([
        reportApi.getSummary(),
        reportApi.getDailyTrends(days)
      ]);
      setSummary(summaryData);
      setTrends(trendsData);
    } catch (error) {
      console.error("Failed to load report analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [days]);

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      await reportApi.exportCSV({
        startDate,
        endDate,
        department
      });
    } catch (error) {
      console.error("Failed to export attendance report:", error);
      alert("Failed to export CSV report. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-outfit text-white">Reports & Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">Generate high-fidelity analytics and export attendance spreadsheets.</p>
        </div>
        
        <button
          onClick={handleExportCSV}
          disabled={isExporting || isLoading}
          className="flex items-center justify-center px-5 py-2.5 bg-emerald-600 border border-emerald-500 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/20 text-white rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? 'Generating CSV...' : 'Export Attendance (CSV)'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Analytics Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Trends Chart card */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-base font-bold font-outfit text-white">Attendance Analytics Trend</h2>
                <p className="text-xs text-slate-500 mt-0.5">Biometric logs distributions over time.</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400 font-semibold">Timeframe:</span>
                <select
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-850 px-2.5 py-1.5 rounded-lg text-xs outline-none text-slate-300"
                >
                  <option value={7}>Last 7 Sessions</option>
                  <option value={15}>Last 15 Sessions</option>
                  <option value={30}>Last 30 Sessions</option>
                </select>
              </div>
            </div>
            
            {isLoading ? (
              <div className="h-[320px] flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-3 border-brand-500 border-t-transparent"></div>
              </div>
            ) : (
              <AttendanceChart data={trends} />
            )}
          </div>

          {/* Department Performance card */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-base font-bold font-outfit text-white mb-6">Department Attendance Distribution</h2>
            {isLoading ? (
              <div className="w-full flex justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
              </div>
            ) : summary?.department_breakdown && Object.keys(summary.department_breakdown).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(summary.department_breakdown).map(([dept, counts]) => {
                  const rate = counts.total > 0 ? Math.round((counts.present / counts.total) * 100) : 0;
                  return (
                    <div key={dept} className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-white mb-0.5">{dept}</p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {counts.present} Present / {counts.total} Enrolled
                        </p>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className={`text-base font-bold font-outfit ${
                          rate >= 75 ? 'text-emerald-400' : rate >= 50 ? 'text-amber-400' : 'text-rose-400'
                        }`}>
                          {rate}%
                        </span>
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Attendance</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-slate-500 text-xs py-12">No department performance metrics.</div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Export CSV Filters & Static Insights */}
        <div className="space-y-6">
          {/* CSV Export filters card */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-sm font-bold font-outfit text-white pb-3 border-b border-slate-800 mb-5">Export Filters</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Start Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-500 pointer-events-none" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950/60 border border-slate-850 focus:border-brand-500 rounded-xl text-xs outline-none text-slate-300 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">End Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-500 pointer-events-none" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950/60 border border-slate-850 focus:border-brand-500 rounded-xl text-xs outline-none text-slate-300 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-850 focus:border-brand-500 rounded-xl text-xs outline-none text-slate-400 transition-all appearance-none text-slate-300"
                >
                  <option value="">All Departments</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleExportCSV}
                  disabled={isExporting}
                  className="w-full flex items-center justify-center py-2.5 bg-emerald-600/10 border border-emerald-500/20 hover:bg-emerald-600 hover:text-white text-emerald-400 rounded-xl text-xs font-bold transition-all duration-200"
                >
                  <Download className="h-3.5 w-3.5 mr-2" />
                  {isExporting ? 'Exporting...' : 'Export Filtered Logs'}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats Panel */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-sm font-bold font-outfit text-white pb-3 border-b border-slate-800 mb-5">Analytics Insights</h2>
            <div className="space-y-4 text-xs">
              <div className="flex items-start space-x-3 text-slate-400">
                <TrendingUp className="h-4.5 w-4.5 text-brand-400 flex-shrink-0 mt-0.5" />
                <p>Biometric matching rate remains high at <strong className="text-white">96% average confidence</strong> across facial models.</p>
              </div>
              <div className="flex items-start space-x-3 text-slate-400">
                <PieChart className="h-4.5 w-4.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <p>Computer Science holds the highest attendance rate this week.</p>
              </div>
              <div className="flex items-start space-x-3 text-slate-400">
                <ShieldAlert className="h-4.5 w-4.5 text-rose-400 flex-shrink-0 mt-0.5" />
                <p>Students arriving after <strong className="text-white">9:00 AM</strong> are automatically logged under late arrivals category.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
