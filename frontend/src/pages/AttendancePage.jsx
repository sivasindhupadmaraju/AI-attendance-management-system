import React, { useState, useEffect } from 'react';
import { Camera, CheckCircle2, AlertCircle, RefreshCcw, ShieldAlert, Clock, UserCheck } from 'lucide-react';
import WebcamCapture from '../components/WebcamCapture';
import { attendanceApi } from '../api/attendanceApi';

const AttendancePage = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [logs, setLogs] = useState([]);
  const [sessionCount, setSessionCount] = useState(0);

  // Fetch today's logs on mount to populate the side list
  const fetchTodayLogs = async () => {
    try {
      const todayData = await attendanceApi.getTodayAttendance();
      setLogs(todayData);
      
      // Calculate active sessions count (unique students present/late)
      const uniqueStudents = new Set(todayData.map(log => log.student_id));
      setSessionCount(uniqueStudents.size);
    } catch (error) {
      console.error("Failed to load today's logs:", error);
    }
  };

  useEffect(() => {
    fetchTodayLogs();
  }, []);

  const handleCaptureFrame = async (base64Image) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setScanResult(null);

    try {
      const result = await attendanceApi.recognizeFace(base64Image);
      setScanResult(result);
      
      if (result.success) {
        // Refresh the attendance activity log list immediately
        fetchTodayLogs();
      }
    } catch (error) {
      console.error("Recognition API error:", error);
      setScanResult({
        success: false,
        message: "API error. Please check backend connection status."
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-outfit text-white">Live Biometric Recognition</h1>
        <p className="text-xs text-slate-500 mt-0.5">Automated attendance scanning using webcam stream and neural network matching.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Cols: Webcam Feed & Scan Feedback */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 flex flex-col items-center">
            <h2 className="text-sm font-bold font-outfit text-slate-300 self-start mb-4">Biometric Camera Stream</h2>
            <WebcamCapture onCapture={handleCaptureFrame} isProcessing={isProcessing} />
          </div>

          {/* Diagnostic & Scan Result Feedback Card */}
          {scanResult && (
            <div className={`p-5 rounded-2xl border animate-slide-in transition-all duration-300 ${
              scanResult.success 
                ? scanResult.status === 'late' 
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.05)]' 
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.05)]'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300 shadow-[0_0_20px_rgba(239,68,68,0.05)]'
            }`}>
              <div className="flex items-start space-x-4">
                <div className={`p-2.5 rounded-xl border mt-0.5 ${
                  scanResult.success
                    ? scanResult.status === 'late'
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                }`}>
                  {scanResult.success ? <CheckCircle2 className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
                </div>
                
                <div className="flex-1 space-y-1">
                  <h3 className="font-bold text-white text-base">
                    {scanResult.success ? `Recognized: ${scanResult.name}` : 'Unknown Profile'}
                  </h3>
                  <p className="text-xs font-semibold">{scanResult.message}</p>
                  
                  {scanResult.success && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-2 text-[11px] text-slate-400 font-medium">
                      <span>Roll: <strong className="text-brand-400 font-mono">{scanResult.student_id}</strong></span>
                      <span>Confidence: <strong className="text-white">{Math.round(scanResult.confidence * 100)}%</strong></span>
                      <span>Status: <strong className={`uppercase ${
                        scanResult.status === 'late' ? 'text-amber-400' : 'text-emerald-400'
                      }`}>{scanResult.status}</strong></span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Live Scan Log */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 flex flex-col h-[560px]">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold font-outfit text-white">Biometric Scan Log</h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Real-time attendance recordings today.</p>
            </div>
            <div className="px-2.5 py-1 bg-slate-950 border border-slate-850 rounded-xl text-xs font-bold text-slate-400">
              {sessionCount} Checked In
            </div>
          </div>

          {/* Logs List scrollable */}
          <div className="flex-1 overflow-y-auto mt-4 space-y-3 pr-1">
            {logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center py-12">
                <Clock className="h-10 w-10 text-slate-800 mb-3" />
                <p className="text-xs font-semibold text-slate-400">Waiting for Camera Scans</p>
                <p className="text-[10px] text-slate-600 max-w-[180px] mt-1">Activate feed and present face to camera to record logs.</p>
              </div>
            ) : (
              logs.map((log) => {
                const s = log.student || {};
                const isLate = log.status.toLowerCase() === 'late';
                return (
                  <div 
                    key={log.id} 
                    className="p-3 bg-slate-950/40 border border-slate-850 hover:border-slate-800 rounded-xl flex items-center justify-between group transition-all duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 text-xs font-bold font-mono">
                        {s.name ? s.name.substring(0, 2).toUpperCase() : '??'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white group-hover:text-brand-400 transition-colors">{s.name || 'Unknown'}</p>
                        <p className="text-[10px] text-slate-500 font-medium font-mono">{s.student_id || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider mb-1 ${
                        isLate 
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                          : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      }`}>
                        {log.status}
                      </span>
                      <p className="text-[10px] text-slate-500 font-semibold">
                        {log.time_in ? log.time_in.substring(0, 5) : ''}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;
