'use client';

import { useState, useEffect } from 'react';
import client from '@/lib/api/client';
import { useAuth } from '@/lib/hooks/useAuth';
import type { DashboardData, Test, Attempt, AttemptReport } from '@/lib/types';
import toast from 'react-hot-toast';
import {
  BarChart2,
  TrendingUp,
  Award,
  Users,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [tests, setTests] = useState<Test[]>([]);
  const [latestReport, setLatestReport] = useState<AttemptReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      client.get('/dashboard').catch(() => ({ data: null })),
      client.get('/tests').catch(() => ({ data: { data: [] } })),
    ])
      .then(([dashRes, testsRes]) => {
        if (dashRes.data) setDashboardData(dashRes.data);
        const testList: Test[] = testsRes.data?.data ?? testsRes.data ?? [];
        setTests(testList);

        // For students/individuals: fetch the most recent submitted attempt's report
        const role = user?.roles?.[0];
        if (role === 'student' || role === 'individual') {
          setReportLoading(true);
          client
            .get('/attempts?status=submitted&limit=1')
            .then(r => {
              const attempts: Attempt[] = r.data?.data ?? r.data ?? [];
              if (attempts.length > 0) {
                const latestAttemptId = attempts[0].id;
                return client.get(`/attempts/${latestAttemptId}/report`);
              }
              return null;
            })
            .then(reportRes => {
              if (reportRes?.data) {
                setLatestReport(reportRes.data.data ?? reportRes.data);
              }
            })
            .catch(() => {
              // Silently ignore — report is optional
            })
            .finally(() => setReportLoading(false));
        }
      })
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const role = user?.roles?.[0] ?? 'individual';
  const totalAttemptsAcrossTests = tests.reduce((acc, t) => acc + (t.attempts_count ?? 0), 0);
  const publishedTestsCount = tests.filter(t => t.status === 'published').length;
  const showInsights = role === 'student' || role === 'individual';

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {role === 'student' ? 'My Learning Analytics' : 'Performance & Analytics'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {role === 'student'
              ? 'Track your test scores, strengths, and areas for improvement'
              : 'Detailed breakdown of test engagement, completion, and student trends'}
          </p>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {role === 'student' ? (
          <>
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl"><Award className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tests Attempted</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                    {dashboardData && 'total_attempts' in dashboardData ? dashboardData.total_attempts : 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 rounded-xl"><TrendingUp className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Average Score</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                    {dashboardData && 'average_score' in dashboardData && dashboardData.average_score != null
                      ? `${Math.round(dashboardData.average_score)}%` : '—'}
                  </p>
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-xl"><CheckCircle2 className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Completed</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                    {dashboardData && 'recent_attempts' in dashboardData ? dashboardData.recent_attempts.length : 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl"><BookOpen className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Assigned Tests</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{tests.length}</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl"><BookOpen className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Tests</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{tests.length}</p>
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 rounded-xl"><CheckCircle2 className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Published</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{publishedTestsCount}</p>
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-xl"><Users className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Candidate Attempts</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                    {totalAttemptsAcrossTests ||
                      (dashboardData && 'total_attempts' in dashboardData ? dashboardData.total_attempts : 0)}
                  </p>
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl"><TrendingUp className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active Tests</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{publishedTestsCount}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Test-wise or Attempt-wise breakdown */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              {role === 'student' ? 'Recent Assessment Results' : 'Test Performance Breakdown'}
            </h2>

            {role === 'student' && dashboardData && 'recent_attempts' in dashboardData ? (
              dashboardData.recent_attempts.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">
                  No tests attempted yet. Go to &ldquo;My Tests&rdquo; to begin!
                </p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {dashboardData.recent_attempts.map(att => (
                    <div key={att.id} className="py-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">
                          {att.test?.title ?? `Test #${att.test_id}`}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {att.submitted_at ? new Date(att.submitted_at).toLocaleDateString() : 'In progress'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-base font-bold text-indigo-600 dark:text-indigo-400">
                          {att.score != null ? `${Math.round(att.score)}%` : '—'}
                        </span>
                        <span className={`badge ${att.score != null && att.score >= 50 ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300' : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'}`}>
                          {att.score != null && att.score >= 50 ? 'Passed' : 'Needs Review'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : tests.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">
                No tests created yet. Create a test to view performance analytics.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {tests.map(test => (
                  <div key={test.id} className="py-4 flex items-center justify-between">
                    <div>
                      <Link
                        href={`/dashboard/tests/${test.id}/results`}
                        className="font-semibold text-slate-900 dark:text-white text-sm hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5 transition-colors"
                      >
                        {test.title}
                        <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
                      </Link>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {test.duration_minutes} mins · Pass mark:{' '}
                        {test.passing_score != null ? `${test.passing_score}%` : 'None'}
                        {test.has_negative_marking && (
                          <span className="ml-2 text-amber-600 dark:text-amber-400">⚠ Negative marking</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-right">
                        <p className="font-bold text-slate-900 dark:text-white">{test.attempts_count ?? 0} attempts</p>
                        <span className="badge bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 capitalize text-xs">{test.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Real AI Pedagogical Insights from user's own attempt reports */}
        <div className="space-y-6">
          <div className="card p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-teal-500" />
              AI Pedagogical Insights
            </h2>

            {!showInsights ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                AI insights are generated for students and applicants based on submitted
                test performance. Insights highlight strong and weak topic areas and provide
                targeted study advice.
              </p>
            ) : reportLoading ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 py-4">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Loading your AI insights…
              </div>
            ) : latestReport ? (
              <div className="space-y-3">
                {latestReport.ai_summary && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                    {latestReport.ai_summary}
                  </p>
                )}
                {latestReport.strong_topics.length > 0 && (
                  <div className="p-3 bg-teal-50/60 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/60 rounded-xl">
                    <p className="text-xs font-bold text-teal-800 dark:text-teal-300 flex items-center gap-1 mb-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Strong Topics
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {latestReport.strong_topics.map(t => (
                        <span key={t} className="badge bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 text-[10px]">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
                {latestReport.weak_topics.length > 0 && (
                  <div className="p-3 bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/60 rounded-xl">
                    <p className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1 mb-1">
                      <AlertTriangle className="h-3.5 w-3.5" /> Focus Areas
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {latestReport.weak_topics.map(t => (
                        <span key={t} className="badge bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 text-[10px]">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
                {latestReport.topic_advice.length > 0 && (
                  <div className="space-y-2">
                    {latestReport.topic_advice.slice(0, 2).map(advice => (
                      <div key={advice.topic} className="p-2.5 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 rounded-xl">
                        <p className="text-[11px] font-semibold text-indigo-900 dark:text-indigo-300">{advice.topic}</p>
                        <p className="text-[11px] text-indigo-700 dark:text-indigo-400 mt-0.5 leading-relaxed">{advice.advice}</p>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-slate-400">Based on your most recent test submission</p>
              </div>
            ) : (
              <div className="text-center py-6 space-y-2">
                <Sparkles className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Complete a test to receive personalised AI insights on your strengths and areas for improvement.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
