import React, { useState } from 'react';
import { Menu, X, Camera, LayoutDashboard, Users, FileSpreadsheet, BarChart3, LogOut, CheckCircle2, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard },
    { name: 'Live Attendance', to: '/attendance', icon: Camera },
    { name: 'Student Directory', to: '/students', icon: Users },
    { name: 'Attendance Records', to: '/records', icon: FileSpreadsheet },
    { name: 'Reports & Analytics', to: '/reports', icon: BarChart3 },
    { name: 'Account Settings', to: '/account', icon: Settings },
  ];

  return (
    <>
      <header className="bg-slate-900 border-b border-slate-800 h-16 flex items-center justify-between px-6 z-10">
        {/* Left: Mobile Burger Menu */}
        <div className="flex items-center space-x-3 md:space-x-0">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="md:hidden flex items-center space-x-2">
            <Camera className="h-5 w-5 text-brand-500" />
            <span className="font-outfit font-bold text-sm tracking-wide text-white">SmartAttend</span>
          </div>
        </div>

        {/* Right side information */}
        <div className="flex items-center space-x-4 ml-auto">
          {/* Glowing Status Dot */}
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="h-2 w-2 rounded-full bg-emerald-500 absolute"></span>
            <span>API Online</span>
          </div>

          <div className="h-8 w-px bg-slate-800 hidden sm:block"></div>

          {/* User Profile display */}
          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-200">{user?.full_name}</p>
              <div className="flex items-center justify-end space-x-1.5 mt-0.5">
                <span className="text-[9px] bg-brand-500/10 text-brand-400 border border-brand-500/20 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                  {user?.role}
                </span>
                {user?.role === 'teacher' && (
                  <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider max-w-[120px] truncate">
                    {user?.department}
                  </span>
                )}
              </div>
            </div>
            
            <div className="h-8 w-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 text-xs">
              {user?.full_name ? user.full_name.substring(0, 1) : 'A'}
            </div>
          </div>
        </div>
      </header>


      {/* Mobile Sidebar Slideout Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          ></div>

          {/* Drawer content panel */}
          <div className="relative flex flex-col w-full max-w-xs bg-slate-900 border-r border-slate-800 h-full p-6 shadow-2xl animate-slide-in">
            {/* Close button */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-2">
                <Camera className="h-5 w-5 text-brand-500" />
                <span className="font-outfit font-bold text-lg text-white">SmartAttend</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 border border-transparent hover:border-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile Nav Links */}
            <nav className="flex-1 space-y-1">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => `
                    flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                    ${isActive 
                      ? 'bg-brand-600 text-white shadow-lg' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }
                  `}
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                </NavLink>
              ))}
            </nav>

            {/* Mobile Footer logout */}
            <div className="mt-auto border-t border-slate-800 pt-6">
              <div className="flex items-center space-x-3 mb-4 px-2">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center font-bold text-white text-sm">
                  {user?.full_name ? user.full_name.substring(0, 2).toUpperCase() : 'AD'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{user?.full_name}</p>
                  <p className="text-xs text-slate-500 lowercase">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center px-4 py-2.5 text-sm font-medium text-rose-400 hover:text-white hover:bg-rose-500/10 rounded-xl border border-transparent hover:border-rose-500/20 transition-all duration-200"
              >
                <LogOut className="mr-3 h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
