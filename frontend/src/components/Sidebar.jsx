import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Camera, 
  Users, 
  FileSpreadsheet, 
  BarChart3, 
  ShieldAlert, 
  LogOut,
  Settings,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { logout, user } = useAuth();

  const navigation = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard },
    { name: 'Live Attendance', to: '/attendance', icon: Camera },
    { name: 'Student Directory', to: '/students', icon: Users },
    { name: 'Attendance Records', to: '/records', icon: FileSpreadsheet },
    { name: 'Reports & Analytics', to: '/reports', icon: BarChart3 },
    { name: 'Period Analytics', to: '/periods', icon: Clock },
    { name: 'Account Settings', to: '/account', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col bg-slate-900 border-r border-slate-800 h-full">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-brand-500/10 rounded-lg text-brand-500 border border-brand-500/20">
            <Camera className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-outfit font-bold text-base bg-gradient-to-r from-white via-slate-100 to-brand-500 bg-clip-text text-transparent tracking-wide">
              SmartAttend AI
            </h1>
            <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase -mt-0.5">Biometrics System</p>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.to}
            className={({ isActive }) => `
              flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group
              ${isActive 
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20 border border-brand-500/30' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
              }
            `}
          >
            <item.icon className="mr-3 h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* User Footer Panel */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center space-x-3 mb-4 px-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center font-bold text-white text-sm uppercase">
            {user?.full_name ? user.full_name.substring(0, 2) : 'AD'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.full_name}</p>
            <p className="text-[10px] text-slate-500 truncate lowercase">{user?.email}</p>
            {user?.role === 'teacher' && (
              <span className="inline-block px-1.5 py-0.5 mt-0.5 rounded text-[8px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 uppercase tracking-wide truncate max-w-[140px]">
                {user?.department}
              </span>
            )}
          </div>
        </div>
        
        <button
          onClick={logout}
          className="w-full flex items-center px-4 py-2.5 text-sm font-medium text-rose-400 hover:text-white hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-xl transition-all duration-200"
        >
          <LogOut className="mr-3 h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
