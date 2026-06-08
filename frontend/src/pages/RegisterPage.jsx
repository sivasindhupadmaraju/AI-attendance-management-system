import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, BookOpen, Lock, ShieldAlert, Fingerprint } from 'lucide-react';
import { authApi } from '../api/authApi';

const RegisterPage = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!department) {
      setError('Please select your department.');
      return;
    }

    setIsSubmitting(true);

    try {
      await authApi.register({
        email,
        full_name: fullName,
        password,
        role: 'teacher',
        department
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Registration failed:', err);
      const msg = err.response?.data?.detail || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-950 p-4 md:p-8 overflow-y-auto">
      {/* Abstract Background Blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-brand-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-brand-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative w-full max-w-lg bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl p-6 md:p-8 animate-scale-in">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center pb-6 border-b border-slate-800/60">
          <div className="p-3 bg-brand-500/10 border border-brand-500/20 text-brand-400 rounded-2xl mb-3 shadow-[0_0_15px_rgba(var(--brand-primary-rgb),0.1)]">
            <Fingerprint className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold font-outfit text-white">Teacher Enrollment</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">Create your teacher profile to access and manage your department's attendance records.</p>
        </div>

        {success ? (
          <div className="mt-8 py-8 flex flex-col items-center text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Registration Successful!</h3>
            <p className="text-xs text-slate-400 max-w-xs">Your teacher profile has been registered. Redirecting to login portal in 3 seconds...</p>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="mt-6 space-y-4">
            {error && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold flex items-center space-x-2">
                <ShieldAlert className="h-4.5 w-4.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Sarah Connor"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-sm placeholder-slate-600 outline-none transition-all duration-200"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="name@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-sm placeholder-slate-600 outline-none transition-all duration-200"
                />
              </div>
            </div>

            {/* Department Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Department / Branch</label>
              <div className="relative">
                <BookOpen className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
                <select
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-800 focus:border-brand-500 rounded-xl text-sm outline-none transition-all duration-200 appearance-none text-slate-300"
                >
                  <option value="" disabled>Select Department</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                </select>
              </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-sm placeholder-slate-600 outline-none transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-sm placeholder-slate-600 outline-none transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 bg-brand-600 border border-brand-500 text-white rounded-xl text-sm font-bold hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-600/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                'Create Profile'
              )}
            </button>

            <div className="text-center pt-4 border-t border-slate-850 text-xs text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-400 hover:text-brand-350 font-bold hover:underline transition-colors">
                Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;
