import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, AlertTriangle, Percent, ArrowUpRight } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import StatCard from '../components/StatCard';
import AttendanceChart from '../components/AttendanceChart';
import AttendanceTable from '../components/AttendanceTable';
import { reportApi } from '../api/reportApi';
import { attendanceApi } from '../api/attendanceApi';

const DashboardPage = () => {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [todayLogs, setTodayLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [summaryData, trendsData, todayLogsData] = await Promise.all([
        reportApi.getSummary(),
        reportApi.getDailyTrends(7),
        attendanceApi.getTodayAttendance()
      ]);
      setSummary(summaryData);
      setTrends(trendsData);
      // Show only top 5 recent logs for dashboard
      setTodayLogs(todayLogsData.slice(0, 5));
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-outfit text-white">System Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">Biometric logs, analytics insights and directory overview.</p>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Registered Students"
          value={isLoading ? '...' : summary?.total_students || 0}
          icon={Users}
          color="blue"
          description="Enrolled in system"
        />
        <StatCard
          title="Today's Attendance Rate"
          value={isLoading ? '...' : `${summary?.attendance_rate || 0}%`}
          icon={Percent}
          color="green"
          description="Rate of active enrollment"
        />
        <StatCard
          title="Marked Present Today"
          value={isLoading ? '...' : summary?.present_today || 0}
          icon={CheckCircle}
          color="purple"
          description={`Includes ${summary?.late_today || 0} late arrivals`}
        />
        <StatCard
          title="Marked Absent Today"
          value={isLoading ? '...' : summary?.absent_today || 0}
          icon={AlertTriangle}
          color="orange"
          description="Missing biometric scans"
        />
      </div>

      {/* Charts & Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols: History Chart */}
        <div className="lg:col-span-2 bg-slate-900/30 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold font-outfit text-white">Attendance History</h2>
              <p className="text-xs text-slate-500 mt-0.5">Biometric logs trends for the last 7 sessions.</p>
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

        {/* Right 1 col: Department breakdown */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-base font-bold font-outfit text-white mb-6">Department Enrolment</h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
            </div>
          ) : summary?.department_breakdown && Object.keys(summary.department_breakdown).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(summary.department_breakdown).map(([dept, counts]) => {
                const total = counts.total || 0;
                const present = counts.present || 0;
                const rate = total > 0 ? Math.round((present / total) * 100) : 0;
                
                return (
                  <div key={dept} className="space-y-1.5 p-3 bg-slate-950/30 rounded-xl border border-slate-900/60">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-slate-300 truncate max-w-[150px]">{dept}</span>
                      <span className="text-slate-500">
                        {present}/{total} present ({rate}%)
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-850 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          rate >= 75 ? 'bg-emerald-500' : rate >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${rate}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-slate-500 text-xs py-12">
              No department data available.
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold font-outfit text-white">Recent Biometric Scans</h2>
            <p className="text-xs text-slate-500 mt-0.5">Most recent biometric logs recorded today.</p>
          </div>
          <NavLink
            to="/records"
            className="flex items-center text-xs font-bold text-brand-400 hover:text-brand-300 transition-colors"
          >
            <span>View All Records</span>
            <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
          </NavLink>
        </div>
        <AttendanceTable records={todayLogs} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default DashboardPage;
