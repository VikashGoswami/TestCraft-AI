'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { login } from '@/lib/api/auth';
import { useAuth } from '@/lib/hooks/useAuth';
import Logo from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import toast from 'react-hot-toast';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  FileCheck2,
  Timer,
  Lightbulb,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dashboard';
  const { user, loading: authLoading, refetch } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      window.location.href = redirectPath;
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ?? 'Login failed. Please check your email and password.'
      );
      setLoading(false);
    }
  };

  /* =========================================================================
     QUICK LOGIN (COMMENTED OUT AS REQUESTED)
     Uncomment this section below if quick demo logins are needed again:
     
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
       { role: 'Individual', label: '👤 Individual', email: 'demo@mcq.com', password: 'password' },
       { role: 'Teacher', label: '👨‍🏫 Teacher', email: 'teacher@mcq.com', password: 'password' },
       { role: 'Student', label: '🎓 Student', email: 'student@mcq.com', password: 'password' },
       { role: 'Admin', label: '🏫 Admin', email: 'admin@mcq.com', password: 'password' },
     ];
     ========================================================================= */

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-50 dark:bg-[#090D16] transition-colors duration-200">
      {/* Top Header Navigation for Mobile/Desktop */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <ThemeToggle showLabel={false} />
      </div>

      {/* Left Column: Brand Hero Showcase (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-indigo-950 via-slate-900 to-[#090D16] p-12 text-white flex-col justify-between overflow-hidden border-r border-slate-800">
        {/* Ambient background glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10">
          <Logo size="lg" showTagline={true} />
        </div>

        {/* Center Hero Copy */}
        <div className="relative z-10 max-w-lg my-auto py-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            AI-Powered Assessment Platform
          </div>

          <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-white mb-5 leading-tight">
            Next-gen AI assessment platform.
          </h1>

          <p className="text-base text-slate-300 mb-8 leading-relaxed">
            Digitize exam papers in seconds, run proctored CBT tests, and empower students with
            AI solutions, shortcuts, and topic analytics.
          </p>

          {/* Key Feature Highlight Pills */}
          <div className="space-y-3.5">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm">
              <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 mt-0.5">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Instant AI Paper Digitization</h2>
                <p className="text-xs text-slate-400">
                  Upload PDFs or images and let Google Gemini AI extract questions, options, and answers in seconds.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm">
              <div className="p-2 rounded-lg bg-teal-500/20 text-teal-400 mt-0.5">
                <Timer className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Proctored CBT Test Engine</h2>
                <p className="text-xs text-slate-400">
                  5-state question palette, countdown timer, auto-submission, and negative marking penalty support.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 mt-0.5">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">AI Solutions & Short Tricks</h2>
                <p className="text-xs text-slate-400">
                  Detailed step-by-step reasoning and memory shortcuts so applicants master concepts directly.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 pt-6 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Deterministic Scoring & Secure CBT Delivery</span>
          </div>
          <span>&copy; {new Date().getFullYear()} TestCraft-AI</span>
        </div>
      </div>

      {/* Right Column: Sign In Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-md">
          {/* Mobile Logo Header */}
          <div className="lg:hidden mb-8">
            <Logo size="md" showTagline={true} />
          </div>

          <div className="card p-8 sm:p-10 shadow-xl shadow-slate-200/50 dark:shadow-2xl dark:shadow-black/50 border border-slate-200 dark:border-slate-800">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Welcome back
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Enter your credentials to access your TestCraft-AI workspace
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    className="input pl-10"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Password
                  </label>
                  <a
                    href="#forgot"
                    onClick={(e) => {
                      e.preventDefault();
                      toast('Password reset available via admin or registration', { icon: 'ℹ️' });
                    }}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    className="input pl-10 pr-10"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-sm font-semibold tracking-wide mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Signing in…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Sign in to TestCraft-AI
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </button>
            </form>

            {/* Quick Login / Demo Logins commented out as requested */}
            {/*
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                ⚡ Quick Demo Logins
              </span>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.role}
                    type="button"
                    disabled={loading}
                    onClick={() => handleQuickLogin(acc.email, acc.password, acc.role)}
                    className="text-xs p-2 border rounded-lg"
                  >
                    {acc.label}
                  </button>
                ))}
              </div>
            </div>
            */}

            {/* Google OAuth Quick Login commented out as requested */}
            {/*
            <div className="mt-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              <span className="text-xs text-slate-400 uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            </div>
            <div className="mt-4">
              <GoogleSignInButton />
            </div>
            */}

            <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
              Don&apos;t have an account?{' '}
              <Link
                href="/register"
                className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#090D16]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
