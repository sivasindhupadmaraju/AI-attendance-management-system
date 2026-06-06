import React from 'react';
import { Calendar, Clock, Award, ShieldQuestion } from 'lucide-react';

const AttendanceTable = ({ records, isLoading }) => {
  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case 'present':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Present
          </span>
        );
      case 'late':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Late Arrival
          </span>
        );
      case 'absent':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            Absent
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            {status}
          </span>
        );
    }
  };

  const formatConfidence = (score) => {
    if (!score) return 'N/A';
    const percent = Math.round(score * 100);
    return (
      <span className="flex items-center space-x-1">
        <Award className="h-3.5 w-3.5 text-brand-400" />
        <span>{percent}%</span>
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!records || records.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-16 text-slate-500 text-center">
        <ShieldQuestion className="h-12 w-12 text-slate-700 mb-4" />
        <p className="text-sm font-semibold text-slate-300 mb-1">No Records Found</p>
        <p className="text-xs text-slate-500">There are no matching attendance logs registered in this view.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/30">
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 font-semibold">
            <th className="px-6 py-4">Student ID</th>
            <th className="px-6 py-4">Name</th>
            <th className="px-6 py-4">Department</th>
            <th className="px-6 py-4">Semester</th>
            <th className="px-6 py-4">Date</th>
            <th className="px-6 py-4">Arrival Time</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Confidence</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {records.map((record) => {
            const student = record.student || {};
            return (
              <tr key={record.id} className="hover:bg-slate-800/25 transition-colors duration-150 text-slate-200">
                <td className="px-6 py-4 font-mono font-semibold text-brand-400">{student.student_id || 'N/A'}</td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-white">{student.name || 'Unknown Student'}</div>
                </td>
                <td className="px-6 py-4">{student.department || 'N/A'}</td>
                <td className="px-6 py-4 text-slate-400">{student.semester || 'N/A'}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-1.5 text-slate-300">
                    <Calendar className="h-4 w-4 text-slate-500" />
                    <span>{record.date}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-1.5 text-slate-300">
                    <Clock className="h-4 w-4 text-slate-500" />
                    <span>{record.time_in ? record.time_in.substring(0, 5) : 'N/A'}</span>
                  </div>
                </td>
                <td className="px-6 py-4">{getStatusBadge(record.status)}</td>
                <td className="px-6 py-4 font-medium text-slate-400">{formatConfidence(record.confidence)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AttendanceTable;
