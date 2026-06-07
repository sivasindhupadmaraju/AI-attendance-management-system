import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Camera, Lock, Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect target back to where they came from or default dashboard root
  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.detail || 
        "Incorrect email/password, or server is offline. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
      {/* Background glow graphics */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-8 relative z-10 glass-panel">
        {/* Brand logo header */}
        <div className="flex flex-col items-center text-center">
          <div className="p-3 bg-brand-600/10 border border-brand-500/20 text-brand-400 rounded-2xl glow-blue mb-4">
            <Camera className="h-8 w-8" />
          </div>
          <h1 className="font-outfit font-extrabold text-2xl text-white tracking-tight">SmartAttend AI</h1>
          <p className="text-xs text-slate-500 mt-1.5 font-medium max-w-[280px]">
            Log in to manage facial recognition directories and daily attendance logs.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold flex items-start space-x-2.5">
              <AlertCircle className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
              <input
                type="email"
                placeholder="email@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-950/60 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-sm placeholder-slate-750 outline-none transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Password</label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
              <input
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-950/60 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-sm placeholder-slate-700 outline-none transition-all duration-200"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-brand-600 border border-brand-500 text-white rounded-xl text-sm font-bold hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-600/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <div className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
