import React, { useState, useEffect } from 'react';
import { Search, Calendar, Filter, FileSpreadsheet, RefreshCcw, Download } from 'lucide-react';
import { attendanceApi } from '../api/attendanceApi';
import { reportApi } from '../api/reportApi';
import AttendanceTable from '../components/AttendanceTable';

const RecordsPage = () => {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  
  // Filter States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [studentId, setStudentId] = useState('');
  const [status, setStatus] = useState('');
  const [department, setDepartment] = useState('');
  const [period, setPeriod] = useState('');

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      await reportApi.exportCSV({
        startDate,
        endDate,
        studentId,
        status,
        department,
        period
      });
    } catch (error) {
      console.error("Failed to export attendance records:", error);
      alert(error.message || "Failed to download logs CSV.");
    } finally {
      setIsExporting(false);
    }
  };

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const data = await attendanceApi.queryAttendance({
        startDate,
        endDate,
        studentId,
        status,
        department,
        period
      });
      setRecords(data);
    } catch (error) {
      console.error("Failed to query historical logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Debounce triggers
    const delayDebounceId = setTimeout(() => {
      fetchRecords();
    }, 455);

    return () => clearTimeout(delayDebounceId);
  }, [startDate, endDate, studentId, status, department, period]);

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setStudentId('');
    setStatus('');
    setDepartment('');
    setPeriod('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-outfit text-white">Attendance Records</h1>
          <p className="text-xs text-slate-500 mt-0.5">Query and search historical student biometric check-in logs.</p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={isExporting || isLoading}
          className="flex items-center justify-center px-5 py-2.5 bg-emerald-600 border border-emerald-500 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/20 text-white rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? 'Exporting...' : 'Download Filtered Logs (CSV)'}
        </button>
      </div>

      {/* Filter Controls Accordion/Panel */}
      <div className="bg-slate-900/35 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-800/80">
          <Filter className="h-4 w-4 text-brand-400" />
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Search Filters</h2>
          
          <button
            onClick={handleResetFilters}
            className="ml-auto flex items-center text-[10px] font-bold text-slate-400 hover:text-white transition-all bg-slate-850 hover:bg-slate-800 border border-slate-800 px-2.5 py-1 rounded-lg"
          >
            <RefreshCcw className="h-3 w-3 mr-1.5" />
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Start Date */}
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

          {/* End Date */}
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

          {/* Student ID search */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Student Roll ID</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder="e.g. CS2026001"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950/60 border border-slate-850 focus:border-brand-500 rounded-xl text-xs outline-none text-slate-300 placeholder-slate-700 transition-all"
              />
            </div>
          </div>

          {/* Department filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/60 border border-slate-850 focus:border-brand-500 rounded-xl text-xs outline-none text-slate-400 transition-all appearance-none"
            >
              <option value="">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Electronics">Electronics</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
              <option value="Civil Engineering">Civil Engineering</option>
              <option value="Information Technology">Information Technology</option>
            </select>
          </div>

          {/* Class Hour filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Class Hour / Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/60 border border-slate-850 focus:border-brand-500 rounded-xl text-xs outline-none text-slate-400 transition-all appearance-none"
            >
              <option value="">All Hours</option>
              <option value="Period 1 (9-10 AM)">Period 1 (9-10 AM)</option>
              <option value="Period 2 (10-11 AM)">Period 2 (10-11 AM)</option>
              <option value="Period 3 (11 AM-12 PM)">Period 3 (11 AM-12 PM)</option>
              <option value="Period 4 (12-1 PM)">Period 4 (12-1 PM)</option>
              <option value="Period 5 (2-3 PM)">Period 5 (2-3 PM)</option>
              <option value="Period 6 (3-4 PM)">Period 6 (3-4 PM)</option>
              <option value="Period 7 (4-5 PM)">Period 7 (4-5 PM)</option>
            </select>
          </div>

          {/* Status filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Attendance Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/60 border border-slate-850 focus:border-brand-500 rounded-xl text-xs outline-none text-slate-400 transition-all appearance-none"
            >
              <option value="">All Statuses</option>
              <option value="present">Present</option>
              <option value="late">Late Arrival</option>
              <option value="absent">Absent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold font-outfit text-white">Records Log Result</h2>
          <span className="text-xs text-slate-500 font-semibold">{records.length} logs found</span>
        </div>
        <AttendanceTable records={records} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default RecordsPage;
