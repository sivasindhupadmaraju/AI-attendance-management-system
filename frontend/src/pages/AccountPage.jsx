import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/authApi';
import { User, Mail, Shield, BookOpen, KeyRound, ShieldAlert, CheckCircle2 } from 'lucide-react';

const AccountPage = () => {
  const { user, updateUser } = useAuth();
  
  // Profile state
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Security state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityError, setSecurityError] = useState('');
  const [securitySuccess, setSecuritySuccess] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!fullName.trim()) {
      setProfileError('Full name is required.');
      return;
    }

    setIsUpdatingProfile(true);

    try {
      const updatedUser = await authApi.updateProfile({ full_name: fullName.trim() });
      updateUser(updatedUser);
      setProfileSuccess('Profile successfully updated.');
    } catch (err) {
      console.error(err);
      setProfileError(err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSecurityError('');
    setSecuritySuccess('');

    if (newPassword !== confirmPassword) {
      setSecurityError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setSecurityError('New password must be at least 6 characters.');
      return;
    }

    setIsUpdatingPassword(true);

    try {
      await authApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword
      });
      setSecuritySuccess('Password successfully changed.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      setSecurityError(err.response?.data?.detail || 'Failed to change password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold font-outfit text-white">Account Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">Manage your personal credentials, profile information, and account security details.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left column: Quick Overview and Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Details Card */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 md:p-8">
            <h2 className="text-lg font-bold font-outfit text-white flex items-center mb-6">
              <User className="h-5 w-5 mr-3 text-brand-400" />
              Profile Settings
            </h2>

            <form onSubmit={handleUpdateProfile} className="space-y-5">
              {profileError && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold flex items-center space-x-2">
                  <ShieldAlert className="h-4.5 w-4.5" />
                  <span>{profileError}</span>
                </div>
              )}
              {profileSuccess && (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold flex items-center space-x-2">
                  <CheckCircle2 className="h-4.5 w-4.5" />
                  <span>{profileSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="Your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-sm placeholder-slate-600 outline-none transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Email (Read Only Display) */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-600" />
                    <input
                      type="email"
                      disabled
                      value={user?.email || ''}
                      className="w-full pl-11 pr-4 py-3 bg-slate-950/20 border border-slate-900 rounded-xl text-sm text-slate-500 cursor-not-allowed outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-slate-600 mt-1 block">Email address cannot be changed. Contact admin for assistance.</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="px-6 py-2.5 bg-brand-600 border border-brand-500 text-white rounded-xl text-sm font-bold hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-600/20 transition-all duration-200 disabled:opacity-50 flex items-center"
                >
                  {isUpdatingProfile ? (
                    <div className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Security Card */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 md:p-8">
            <h2 className="text-lg font-bold font-outfit text-white flex items-center mb-6">
              <KeyRound className="h-5 w-5 mr-3 text-brand-400" />
              Update Password
            </h2>

            <form onSubmit={handleChangePassword} className="space-y-5">
              {securityError && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold flex items-center space-x-2">
                  <ShieldAlert className="h-4.5 w-4.5" />
                  <span>{securityError}</span>
                </div>
              )}
              {securitySuccess && (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold flex items-center space-x-2">
                  <CheckCircle2 className="h-4.5 w-4.5" />
                  <span>{securitySuccess}</span>
                </div>
              )}

              {/* Current Password */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Current Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-sm placeholder-slate-600 outline-none transition-all duration-200"
                  />
                </div>
              </div>

              {/* New Password & Confirm */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">New Password</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
                    <input
                      type="password"
                      required
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-sm placeholder-slate-600 outline-none transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Confirm New Password</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
                    <input
                      type="password"
                      required
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-sm placeholder-slate-600 outline-none transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="px-6 py-2.5 bg-brand-600 border border-brand-500 text-white rounded-xl text-sm font-bold hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-600/20 transition-all duration-200 disabled:opacity-50 flex items-center"
                >
                  {isUpdatingPassword ? (
                    <div className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    'Update Password'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right column: Card display of details and roles */}
        <div className="space-y-6">
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 flex flex-col items-center text-center">
            {/* Avatar display */}
            <div className="h-20 w-20 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 font-bold font-mono text-2xl mb-4 shadow-lg shadow-brand-500/5">
              {user?.full_name ? user.full_name.substring(0, 2).toUpperCase() : '??'}
            </div>
            
            <h3 className="font-bold text-white text-base">{user?.full_name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>

            {/* Badges */}
            <div className="w-full mt-6 pt-6 border-t border-slate-850 space-y-3">
              {/* Role badge */}
              <div className="flex items-center justify-between text-xs px-3.5 py-2.5 bg-slate-950/60 border border-slate-850 rounded-xl">
                <span className="text-slate-400 font-semibold flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-brand-400" />
                  Account Role
                </span>
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-brand-500/10 border border-brand-500/20 text-brand-400">
                  {user?.role}
                </span>
              </div>

              {/* Department badge (teachers only) */}
              {user?.role === 'teacher' && (
                <div className="flex items-center justify-between text-xs px-3.5 py-2.5 bg-slate-950/60 border border-slate-850 rounded-xl">
                  <span className="text-slate-400 font-semibold flex items-center">
                    <BookOpen className="h-4 w-4 mr-2 text-amber-400" />
                    Department
                  </span>
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 text-amber-400 max-w-[140px] truncate">
                    {user?.department}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
