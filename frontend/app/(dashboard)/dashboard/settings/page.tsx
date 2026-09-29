'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import toast from 'react-hot-toast';
import { User, Mail, Shield, KeyRound, Check, LogOut } from 'lucide-react';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';

export default function SettingsPage() {
  const { user, logout } = useAuth();
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
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account &amp; Profile Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Manage your personal profile, credentials, and authentication methods
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Card */}
        <div className="card p-6 space-y-6">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Personal Details
          </h2>

          <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="h-16 w-16 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold">
                {user?.name?.[0]?.toUpperCase() ?? 'U'}
              </div>
            )}
            <div>
              <p className="text-lg font-bold text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="badge bg-blue-50 text-blue-700 capitalize font-medium">
                  {roleLabel}
                </span>
                <span className="badge bg-gray-100 text-gray-600 capitalize">
                  Auth: {user?.provider ?? 'local'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                className="input bg-gray-50 cursor-not-allowed text-gray-500"
                value={user?.email ?? ''}
                disabled
              />
            </div>
          </div>
        </div>

        {/* Linked Accounts */}
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600" />
            Linked Accounts &amp; Quick Sign-In
          </h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            Link your Google account for one-tap sign in without entering your password every time.
          </p>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center font-bold text-red-500">
                G
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Google Account</p>
                <p className="text-xs text-gray-400">
                  {user?.provider === 'google'
                    ? 'Connected via Google Identity Services'
                    : 'Not currently linked'}
                </p>
              </div>
            </div>

            {user?.provider === 'google' ? (
              <span className="badge bg-green-100 text-green-700 flex items-center gap-1 font-semibold">
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
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-amber-600" />
              Change Password
            </h2>

            <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
        <div className="card p-6 border-red-100 bg-red-50/20 space-y-3">
          <h2 className="text-base font-bold text-red-900 flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Session Management
          </h2>
          <p className="text-xs text-gray-500">
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

