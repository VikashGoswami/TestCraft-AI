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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const role = user?.roles?.[0] ?? 'individual';
  const totalAttemptsAcrossTests = tests.reduce((acc, t) => acc + (t.attempts_count ?? 0), 0);
  const publishedTestsCount = tests.filter(t => t.status === 'published').length;
  const showInsights = role === 'student' || role === 'individual';

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {role === 'student' ? 'My Learning Analytics' : 'Performance & Analytics'}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {role === 'student'
              ? 'Track your test scores, strengths, and areas for improvement'
              : 'Detailed breakdown of test engagement, completion, and student trends'}
          </p>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {role === 'student' ? (
          <>
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Award className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Tests Attempted</p>
                  <p className="text-2xl font-bold text-gray-900 mt-0.5">
                    {dashboardData && 'total_attempts' in dashboardData ? dashboardData.total_attempts : 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-green-50 text-green-600 rounded-xl"><TrendingUp className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Average Score</p>
                  <p className="text-2xl font-bold text-gray-900 mt-0.5">
                    {dashboardData && 'average_score' in dashboardData && dashboardData.average_score != null
                      ? `${Math.round(dashboardData.average_score)}%` : '—'}
                  </p>
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><CheckCircle2 className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Completed</p>
                  <p className="text-2xl font-bold text-gray-900 mt-0.5">
                    {dashboardData && 'recent_attempts' in dashboardData ? dashboardData.recent_attempts.length : 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><BookOpen className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Assigned Tests</p>
                  <p className="text-2xl font-bold text-gray-900 mt-0.5">{tests.length}</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><BookOpen className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Total Tests</p>
                  <p className="text-2xl font-bold text-gray-900 mt-0.5">{tests.length}</p>
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-green-50 text-green-600 rounded-xl"><CheckCircle2 className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Published</p>
                  <p className="text-2xl font-bold text-gray-900 mt-0.5">{publishedTestsCount}</p>
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><Users className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Candidate Attempts</p>
                  <p className="text-2xl font-bold text-gray-900 mt-0.5">
                    {totalAttemptsAcrossTests ||
                      (dashboardData && 'total_attempts' in dashboardData ? dashboardData.total_attempts : 0)}
                  </p>
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><TrendingUp className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Active Tests</p>
                  <p className="text-2xl font-bold text-gray-900 mt-0.5">{publishedTestsCount}</p>
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
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-blue-600" />
              {role === 'student' ? 'Recent Assessment Results' : 'Test Performance Breakdown'}
            </h2>

            {role === 'student' && dashboardData && 'recent_attempts' in dashboardData ? (
              dashboardData.recent_attempts.length === 0 ? (
                <p className="text-sm text-gray-500 py-6 text-center">
                  No tests attempted yet. Go to &ldquo;My Tests&rdquo; to begin!
                </p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {dashboardData.recent_attempts.map(att => (
                    <div key={att.id} className="py-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          {att.test?.title ?? `Test #${att.test_id}`}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {att.submitted_at ? new Date(att.submitted_at).toLocaleDateString() : 'In progress'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-base font-bold text-blue-600">
                          {att.score != null ? `${Math.round(att.score)}%` : '—'}
                        </span>
                        <span className={`badge ${att.score != null && att.score >= 50 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                          {att.score != null && att.score >= 50 ? 'Passed' : 'Needs Review'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : tests.length === 0 ? (
              <p className="text-sm text-gray-500 py-6 text-center">
                No tests created yet. Create a test to view performance analytics.
              </p>
            ) : (
              <div className="divide-y divide-gray-100">
                {tests.map(test => (
                  <div key={test.id} className="py-4 flex items-center justify-between">
                    <div>
                      <Link
                        href={`/dashboard/tests/${test.id}/results`}
                        className="font-semibold text-gray-900 text-sm hover:text-blue-600 flex items-center gap-1.5"
                      >
                        {test.title}
                        <ArrowUpRight className="h-3.5 w-3.5 text-gray-400" />
                      </Link>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {test.duration_minutes} mins · Pass mark:{' '}
                        {test.passing_score != null ? `${test.passing_score}%` : 'None'}
                        {test.has_negative_marking && (
                          <span className="ml-2 text-amber-600">⚠ Negative marking</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{test.attempts_count ?? 0} attempts</p>
                        <span className="badge bg-blue-50 text-blue-700 capitalize text-xs">{test.status}</span>
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
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              AI Pedagogical Insights
            </h2>

            {!showInsights ? (
              <p className="text-xs text-gray-500 leading-relaxed">
                AI insights are generated for student and individual users based on their submitted
                test performance. Insights highlight strong and weak topic areas and provide
                targeted study advice.
              </p>
            ) : reportLoading ? (
              <div className="flex items-center gap-2 text-xs text-gray-500 py-4">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Loading your AI insights…
              </div>
            ) : latestReport ? (
              <div className="space-y-3">
                {latestReport.ai_summary && (
                  <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-3 border border-gray-100">
                    {latestReport.ai_summary}
                  </p>
                )}
                {latestReport.strong_topics.length > 0 && (
                  <div className="p-3 bg-green-50 border border-green-100 rounded-lg">
                    <p className="text-xs font-bold text-green-800 flex items-center gap-1 mb-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Strong Topics
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {latestReport.strong_topics.map(t => (
                        <span key={t} className="badge bg-green-100 text-green-800 text-[10px]">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
                {latestReport.weak_topics.length > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                    <p className="text-xs font-bold text-amber-800 flex items-center gap-1 mb-1">
                      <AlertTriangle className="h-3.5 w-3.5" /> Focus Areas
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {latestReport.weak_topics.map(t => (
                        <span key={t} className="badge bg-amber-100 text-amber-800 text-[10px]">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
                {latestReport.topic_advice.length > 0 && (
                  <div className="space-y-2">
                    {latestReport.topic_advice.slice(0, 2).map(advice => (
                      <div key={advice.topic} className="p-2.5 bg-blue-50 border border-blue-100 rounded-lg">
                        <p className="text-[11px] font-semibold text-blue-900">{advice.topic}</p>
                        <p className="text-[11px] text-blue-700 mt-0.5 leading-relaxed">{advice.advice}</p>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-gray-400">Based on your most recent test submission</p>
              </div>
            ) : (
              <div className="text-center py-6 space-y-2">
                <Sparkles className="h-8 w-8 text-gray-300 mx-auto" />
                <p className="text-xs text-gray-500">
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
