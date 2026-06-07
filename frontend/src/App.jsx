import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import AttendancePage from './pages/AttendancePage';
import RecordsPage from './pages/RecordsPage';
import ReportsPage from './pages/ReportsPage';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected App Shell Layout Routes */}
      <Route
        path="/*"
        element={
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
                    <Routes>
                      <Route path="/" element={<DashboardPage />} />
                      <Route path="/attendance" element={<AttendancePage />} />
                      <Route path="/students" element={<StudentsPage />} />
                      <Route path="/records" element={<RecordsPage />} />
                      <Route path="/reports" element={<ReportsPage />} />
                      {/* Redirect anything else back to dashboard */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </div>
                </main>
              </div>
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
