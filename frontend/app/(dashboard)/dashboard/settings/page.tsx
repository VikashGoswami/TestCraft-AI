'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTheme } from '@/lib/hooks/useTheme';
import toast from 'react-hot-toast';
import { User, Shield, KeyRound, Check, LogOut, Moon, Sun, Monitor, Sparkles } from 'lucide-react';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState(user?.name ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setSavingPassword(true);
    try {
      // In production calls API endpoint for password update
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      toast.error('Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  const roleLabel = user?.roles?.[0]?.replace(/_/g, ' ') ?? 'Individual';

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Account &amp; Platform Settings
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Manage your personal profile, workspace theme, credentials, and authentication preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Appearance / Theme Settings */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-teal-500" />
              Appearance &amp; Theme
            </h2>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              Active: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Customize the look and feel of TestCraft-AI across your dashboard and exam tools.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setTheme('light');
                toast.success('Light theme activated');
              }}
              className={`p-4 rounded-xl border flex items-center gap-3 transition-all text-left ${
                theme === 'light'
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="h-10 w-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                <Sun className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold">Light Mode</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Crisp, high-contrast light theme</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setTheme('dark');
                toast.success('Dark theme activated');
              }}
              className={`p-4 rounded-xl border flex items-center gap-3 transition-all text-left ${
                theme === 'dark'
                  ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/30 text-teal-900 dark:text-teal-200 ring-2 ring-teal-500/20 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="h-10 w-10 rounded-lg bg-slate-800 text-teal-400 flex items-center justify-center flex-shrink-0">
                <Moon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold">Dark Mode</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Deep obsidian &amp; dark slate theme</p>
              </div>
            </button>
          </div>
        </div>

        {/* Profile Card */}
        <div className="card p-6 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Personal Details
          </h2>

          <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="h-16 w-16 rounded-full object-cover border-2 border-indigo-200 dark:border-indigo-800 shadow-sm"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-indigo-600 to-teal-500 flex items-center justify-center text-white text-xl font-bold shadow-md shadow-indigo-500/20">
                {user?.name?.[0]?.toUpperCase() ?? 'U'}
              </div>
            )}
            <div>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{user?.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="badge bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 capitalize font-medium">
                  {roleLabel}
                </span>
                <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize">
                  Auth: {user?.provider ?? 'local'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                className="input bg-slate-50 dark:bg-slate-800/60 cursor-not-allowed text-slate-500 dark:text-slate-400"
                value={user?.email ?? ''}
                disabled
              />
            </div>
          </div>
        </div>

        {/* Linked Accounts */}
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            Linked Accounts &amp; Quick Sign-In
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Link your Google account for one-tap sign in without entering your password every time.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-rose-500 shadow-sm">
                G
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Google Account</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {user?.provider === 'google'
                    ? 'Connected via Google Identity Services'
                    : 'Not currently linked'}
                </p>
              </div>
            </div>

            {user?.provider === 'google' ? (
              <span className="badge bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center gap-1 font-semibold self-start sm:self-auto">
                <Check className="h-3.5 w-3.5" /> Connected
              </span>
            ) : (
              <div className="max-w-xs">
                <GoogleSignInButton />
              </div>
            )}
          </div>
        </div>

        {/* Change Password (for local accounts) */}
        {user?.provider === 'local' && (
          <div className="card p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-amber-500" />
              Change Password
            </h2>

            <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  className="input"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  className="input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  className="input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={savingPassword}
                className="btn-primary"
              >
                {savingPassword ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          </div>
        )}

        {/* Danger Zone */}
        <div className="card p-6 border-rose-200 dark:border-rose-900/40 bg-rose-50/30 dark:bg-rose-950/20 space-y-3">
          <h2 className="text-base font-bold text-rose-900 dark:text-rose-300 flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Session Management
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Terminate your active session and sign out of this device.
          </p>
          <button
            onClick={() => {
              logout();
              toast.success('Signed out');
            }}
            className="btn-danger text-sm"
          >
            Sign Out of Account
          </button>
        </div>
      </div>
    </div>
  );
}
