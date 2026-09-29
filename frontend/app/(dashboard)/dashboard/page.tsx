'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import client from '@/lib/api/client';
import { useAuth } from '@/lib/hooks/useAuth';
import type { DashboardData } from '@/lib/types';
import {
  FileText,
  Users2,
  BarChart2,
  TrendingUp,
  GraduationCap,
  CheckCircle,
  Sparkles,
  PlusCircle,
  ArrowRight,
  Clock,
  Award,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client
      .get('/dashboard')
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-3 border-indigo-600 border-t-transparent" />
          <p className="text-xs text-slate-400">Loading metrics…</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8">
        <p className="text-slate-500">Failed to load dashboard data.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* SaaS Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 text-white p-6 sm:p-8 border border-slate-800 shadow-xl">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              TestCraft-AI Workspace
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
              Welcome back, {user?.name ?? 'Educator'} 👋
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Next-gen AI assessment platform. Digitize exam papers in seconds, run proctored CBT
              tests, and empower students with AI solutions, shortcuts, and topic analytics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
            <Link
              href="/dashboard/question-paper"
              className="btn-primary flex items-center gap-2 shadow-lg shadow-indigo-600/30"
            >
              <Sparkles className="w-4 h-4 text-teal-300" />
              <span>Digitize Exam Paper</span>
            </Link>
            <Link
              href="/dashboard/tests/new"
              className="btn-secondary flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Test</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Admin / Individual stats */}
        {'total_tests' in data && (
          <>
            <StatCard
              label="Total Tests"
              value={data.total_tests}
              icon={<FileText className="h-5 w-5" />}
              color="indigo"
              trend="All authored tests"
            />
            <StatCard
              label="Published Tests"
              value={data.published_tests}
              icon={<CheckCircle className="h-5 w-5" />}
              color="emerald"
              trend="Ready for candidates"
            />
            <StatCard
              label="Total Attempts"
              value={data.total_attempts}
              icon={<Users2 className="h-5 w-5" />}
              color="teal"
              trend="Completed submissions"
            />
          </>
        )}

        {/* Teacher stats */}
        {'class_count' in data && (
          <>
            <StatCard
              label="My Classes"
              value={data.class_count}
              icon={<GraduationCap className="h-5 w-5" />}
              color="indigo"
              trend="Enrolled student cohorts"
            />
            <StatCard
              label="Tests Created"
              value={data.test_count}
              icon={<FileText className="h-5 w-5" />}
              color="emerald"
              trend="Authored assessments"
            />
            <StatCard
              label="Total Attempts"
              value={data.total_attempts}
              icon={<BarChart2 className="h-5 w-5" />}
              color="teal"
              trend="Student submissions"
            />
          </>
        )}

        {/* Student stats */}
        {'average_score' in data && !('total_tests' in data) && !('class_count' in data) && (
          <>
            <StatCard
              label="Tests Taken"
              value={data.total_attempts}
              icon={<FileText className="h-5 w-5" />}
              color="indigo"
              trend="Exams attempted"
            />
            <StatCard
              label="Average Score"
              value={data.average_score != null ? `${Math.round(data.average_score)}%` : 'N/A'}
              icon={<TrendingUp className="h-5 w-5" />}
              color="emerald"
              trend="Across all subjects"
            />
          </>
        )}
      </div>

      {/* Quick Action Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card p-6 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                AI Question Paper Extraction
              </h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Have a scanned question paper or test PDF? Drop it into our Gemini-powered engine to automatically extract questions, options, step-by-step solutions, and short trick shortcuts.
            </p>
          </div>
          <Link
            href="/dashboard/question-paper"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
          >
            <span>Launch AI Paper Digitizer</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="card p-6 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                <Clock className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Proctored CBT Delivery & Negative Marking
              </h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Simulate actual competitive exams with real-time timers, 5-state question palettes, and custom penalty points (-0.25, -0.33) with detailed student performance analytics.
            </p>
          </div>
          <Link
            href="/dashboard/tests"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-500"
          >
            <span>Manage & Deliver Tests</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Recent Attempts Table (if present) */}
      {'recent_attempts' in data &&
        Array.isArray(data.recent_attempts) &&
        data.recent_attempts.length > 0 && (
          <div className="card overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Recent Submissions
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Latest candidate exam attempts and performance results
                </p>
              </div>
              <Link
                href="/dashboard/tests"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Assessment
                    </th>
                    <th className="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Candidate
                    </th>
                    <th className="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Score
                    </th>
                    <th className="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {(data.recent_attempts as any[]).map((attempt: any) => (
                    <tr
                      key={attempt.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-white">
                        {attempt.test?.title ?? 'Untitled Assessment'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                        {attempt.user?.name ?? attempt.guest_name ?? 'Guest Candidate'}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">
                        {attempt.score != null ? `${Math.round(attempt.score)}%` : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={attempt.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
    </div>
  );
}

const COLOR_MAP: Record<string, { bg: string; icon: string; border: string }> = {
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/60',
    icon: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-100 dark:border-indigo-900/40',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/60',
    icon: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-100 dark:border-emerald-900/40',
  },
  teal: {
    bg: 'bg-teal-50 dark:bg-teal-950/60',
    icon: 'text-teal-600 dark:text-teal-400',
    border: 'border-teal-100 dark:border-teal-900/40',
  },
};

function StatCard({
  label,
  value,
  icon,
  color = 'indigo',
  trend,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  trend?: string;
}) {
  const conf = COLOR_MAP[color] ?? COLOR_MAP.indigo;

  return (
    <div className="card p-6 flex items-start justify-between border border-slate-200 dark:border-slate-800">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
          {label}
        </p>
        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          {value}
        </p>
        {trend && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-medium">
            {trend}
          </p>
        )}
      </div>
      <div className={`p-3 rounded-2xl ${conf.bg} ${conf.icon} border ${conf.border}`}>
        {icon}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    submitted:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800',
    in_progress:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800',
    started:
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-800',
    expired:
      'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${
        map[status] ??
        'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
      }`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}
