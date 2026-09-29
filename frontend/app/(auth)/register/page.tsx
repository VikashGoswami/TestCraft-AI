'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { register } from '@/lib/api/auth';
import { useAuth } from '@/lib/hooks/useAuth';
import Logo from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import toast from 'react-hot-toast';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  School,
  BookOpen,
  UserCheck,
} from 'lucide-react';

const ROLES = [
  {
    value: 'individual',
    label: 'Individual',
    desc: 'Create, test & share exams',
    icon: UserCheck,
  },
  {
    value: 'teacher',
    label: 'Teacher',
    desc: 'Manage classes & students',
    icon: BookOpen,
  },
  {
    value: 'institution_admin',
    label: 'Admin',
    desc: 'Institution analytics & staff',
    icon: School,
  },
  {
    value: 'student',
    label: 'Student',
    desc: 'Take exams & view solutions',
    icon: GraduationCap,
  },
] as const;

export default function RegisterPage() {
  const router = useRouter();
  const { refetch } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<string>('individual');
  const [loading, setLoading] = useState(false);

  /* =========================================================================
     QUICK DEMO REGISTRATION (COMMENTED OUT AS REQUESTED)
     Uncomment if demo auto-fill is needed:

     const handleFillDemo = (targetRole: string = 'individual') => {
       const randomId = Math.floor(1000 + Math.random() * 9000);
       setName(`Demo User ${randomId}`);
       setEmail(`test_${targetRole}_${randomId}@example.com`);
       setPassword('password123');
       setPasswordConfirmation('password123');
       setRole(targetRole);
       toast.success(`Filled demo data for ${targetRole}!`);
     };
     ========================================================================= */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirmation) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await register({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        role,
      });
      await refetch();
      toast.success('Account created! Welcome to TestCraft-AI.');
      window.location.href = '/dashboard';
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      if (errors) {
        Object.values(errors)
          .flat()
          .forEach((msg: any) => toast.error(msg));
      } else {
        toast.error(err.response?.data?.message ?? 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-50 dark:bg-[#090D16] transition-colors duration-200">
      {/* Top Header Navigation */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <ThemeToggle showLabel={false} />
      </div>

      {/* Left Column: Brand Hero Showcase (Desktop) */}
      <div className="hidden lg:flex lg:w-5/12 relative bg-gradient-to-br from-indigo-950 via-slate-900 to-[#090D16] p-12 text-white flex-col justify-between overflow-hidden border-r border-slate-800">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10">
          <Logo size="lg" showTagline={true} />
        </div>

        {/* Center Hero Copy */}
        <div className="relative z-10 max-w-md my-auto py-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            Get Started in Seconds
          </div>

          <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white mb-4 leading-tight">
            Start creating AI-powered assessments today.
          </h1>

          <p className="text-sm text-slate-300 mb-6 leading-relaxed">
            Join thousands of educators, tutors, and students using TestCraft-AI to digitize paper exams, run competitive CBT tests, and gain deep performance analytics.
          </p>

          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Full Platform Capabilities Included:</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-1.5 pl-6 list-disc">
              <li>Automatic Gemini AI Question Paper Extraction (PDF/Image)</li>
              <li>Realistic CBT exam runner with negative marking (-0.25 / -0.33)</li>
              <li>Instant AI solutions, shortcuts, and topic analytics for every question</li>
              <li>Role-based access: Individual, Teacher, School Admin & Student</li>
            </ul>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 pt-6 border-t border-slate-800/80">
          <span>&copy; {new Date().getFullYear()} TestCraft-AI</span>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>AI Models Ready</span>
          </div>
        </div>
      </div>

      {/* Right Column: Register Form */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto">
        <div className="w-full max-w-lg py-6">
          {/* Mobile Logo Header */}
          <div className="lg:hidden mb-6">
            <Logo size="md" showTagline={true} />
          </div>

          <div className="card p-8 sm:p-10 shadow-xl shadow-slate-200/50 dark:shadow-2xl dark:shadow-black/50 border border-slate-200 dark:border-slate-800">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Create your TestCraft-AI account
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Select your role and start crafting intelligent exams in seconds
              </p>
            </div>

            {/* Role Selector Grid */}
            <div className="mb-6">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                Choose your role
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ROLES.map((r) => {
                  const Icon = r.icon;
                  const isSelected = role === r.value;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                        isSelected
                          ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20 shadow-sm'
                          : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <Icon className={`h-5 w-5 mb-1.5 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                      <span className="text-xs font-bold">{r.label}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-1 mt-0.5">{r.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    className="input pl-10"
                    type="text"
                    placeholder="Prof. John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
              </div>

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
                    placeholder="john@school.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      className="input pl-10 pr-10"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min 8 chars"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      autoComplete="new-password"
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

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      className="input pl-10"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Repeat password"
                      value={passwordConfirmation}
                      onChange={(e) => setPasswordConfirmation(e.target.value)}
                      required
                      minLength={8}
                      autoComplete="new-password"
                    />
                  </div>
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
                    Creating account…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Create TestCraft-AI Account
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </button>
            </form>

            {/* Quick Demo Registration commented out as requested */}
            {/*
            <div className="mt-4 p-3 bg-blue-50 border rounded-lg">
              <span className="text-xs">⚡ Quick Demo Registration</span>
            </div>
            */}

            {/* Quick Google Sign In commented out as requested */}
            {/*
            <div className="mt-4">
              <GoogleSignInButton />
            </div>
            */}

            <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
