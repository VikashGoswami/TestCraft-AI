'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { login } from '@/lib/api/auth';
import { useAuth } from '@/lib/hooks/useAuth';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import toast from 'react-hot-toast';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dashboard';
  const { user, loading: authLoading, refetch } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect to dashboard immediately
  useEffect(() => {
    if (!authLoading && user) {
      router.replace(redirectPath);
    }
  }, [authLoading, user, router, redirectPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ email, password });
      await refetch();
      toast.success('Signed in successfully!');
      // Hard navigation ensures fresh session cookies are picked up cleanly
      window.location.href = redirectPath;
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string, roleName: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setLoading(true);
    try {
      await login({ email: demoEmail, password: demoPass });
      await refetch();
      toast.success(`Signed in as ${roleName}!`);
      window.location.href = redirectPath;
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Quick login failed');
      setLoading(false);
    }
  };

  const DEMO_ACCOUNTS = [
    {
      role: 'Individual',
      label: '👤 Individual',
      email: 'demo@mcq.com',
      password: 'password',
      color: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200',
    },
    {
      role: 'Teacher',
      label: '👨‍🏫 Teacher',
      email: 'teacher@mcq.com',
      password: 'password',
      color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200',
    },
    {
      role: 'Student',
      label: '🎓 Student',
      email: 'student@mcq.com',
      password: 'password',
      color: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200',
    },
    {
      role: 'Institution Admin',
      label: '🏫 Admin',
      email: 'admin@mcq.com',
      password: 'password',
      color: 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200',
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="card p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Sign in</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {/* Quick Demo Logins */}
        <div className="mt-5 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              ⚡ Quick Demo Logins
            </span>
            <span className="text-[11px] text-gray-400 font-mono">password</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.role}
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin(acc.email, acc.password, acc.role)}
                className={`flex items-center justify-between px-3 py-2 text-xs font-medium border rounded-lg transition-colors ${acc.color}`}
              >
                <span>{acc.label}</span>
                <span className="text-[10px] opacity-75 font-mono">1-click</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-sm text-gray-500">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        <div className="mt-4">
          <GoogleSignInButton />
        </div>
        <p className="mt-6 text-center text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-blue-600 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
