import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AccountPage from './pages/AccountPage';
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import AttendancePage from './pages/AttendancePage';
import RecordsPage from './pages/RecordsPage';
import ReportsPage from './pages/ReportsPage';
import PeriodAnalyticsPage from './pages/PeriodAnalyticsPage';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Layout wrapper for all protected pages
const AppLayout = () => (
  <ProtectedRoute>
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar drawer navigation (medium screen and up) */}
      <Sidebar />

      {/* Viewport container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar header */}
        <Navbar />

        {/* Main Scrollable View Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-950/20">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  </ProtectedRoute>
);

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected App Shell Layout Routes */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/records" element={<RecordsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/periods" element={<PeriodAnalyticsPage />} />
        <Route path="/account" element={<AccountPage />} />
        {/* Redirect anything else back to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;

