'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getReport, getAttemptReview } from '@/lib/api/attempts';
import type { AttemptReport } from '@/lib/types';
import type { AttemptReviewData } from '@/lib/api/attempts';
import AttemptReviewModal from '@/components/test-runner/AttemptReviewModal';
import Logo from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import toast from 'react-hot-toast';
import {
  Award,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BookOpen,
  RefreshCw,
  HelpCircle,
  Sparkles,
  MinusCircle,
  TrendingUp,
  CheckSquare,
  AlertTriangle,
  ArrowRight,
  Eye,
} from 'lucide-react';
import Link from 'next/link';

function ResultPageContent() {
  const searchParams = useSearchParams();
  const attemptId = searchParams.get('attemptId');

  const [report, setReport] = useState<AttemptReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [pollingCount, setPollingCount] = useState(0);

  // Question review modal state
  const [selectedReview, setSelectedReview] = useState<AttemptReviewData | null>(null);
  const [loadingReview, setLoadingReview] = useState(false);

  const handleOpenReview = async () => {
    if (!attemptId) return;
    setLoadingReview(true);
    try {
      const reviewData = await getAttemptReview(Number(attemptId));
      setSelectedReview(reviewData);
    } catch {
      toast.error('Failed to load question-by-question review.');
    } finally {
      setLoadingReview(false);
    }
  };

  useEffect(() => {
    if (!attemptId) return;

    let timer: NodeJS.Timeout;
    const fetchReport = async () => {
      try {
        const res = await getReport(Number(attemptId));
        setReport(res as AttemptReport);

        // Keep polling if status is still pending (max 10 tries ~30s)
        if (res.generation_status === 'pending' && pollingCount < 10) {
          timer = setTimeout(() => {
            setPollingCount((prev) => prev + 1);
          }, 3000);
        } else {
          setLoading(false);
        }
      } catch {
        setLoading(false);
      }
    };

    fetchReport();
    return () => clearTimeout(timer);
  }, [attemptId, pollingCount]);

  if (loading && !report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#090D16]">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-indigo-600 border-t-transparent mx-auto" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Calculating score &amp; generating AI insights…
          </p>
        </div>
      </div>
    );
  }

  const isPending = report?.generation_status === 'pending';

  const totalQuestions = report?.total_questions ?? 0;
  const attemptedQuestions = report?.attempted_questions ?? 0;
  const correctQuestions = report?.correct_questions ?? 0;
  const wrongQuestions = report?.wrong_questions ?? 0;
  const unattemptedQuestions =
    report?.unattempted_questions ?? Math.max(0, totalQuestions - attemptedQuestions);
  const totalEarnedMarks = report?.total_earned_marks ?? 0;
  const totalPossibleMarks = report?.total_possible_marks ?? totalQuestions;
  const scorePercent = report?.score != null ? Math.round(report.score) : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 transition-colors duration-200">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Branding Navbar */}
        <div className="flex items-center justify-between pb-2">
          <Logo size="md" showTagline={false} href="/dashboard" />
          <ThemeToggle />
        </div>

        {/* Header Assessment Title & Score Card */}
        <div className="card p-6 sm:p-10 text-center space-y-6 shadow-xl shadow-slate-200/50 dark:shadow-2xl dark:shadow-black/50 border border-slate-200 dark:border-slate-800">
          <div className="h-16 w-16 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto shadow-inner border border-indigo-100 dark:border-indigo-900/50">
            <Award className="h-8 w-8" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 px-3 py-1 rounded-full">
              Assessment Result Summary
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-3">
              {report?.test_title || 'Assessment Completed'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Detailed performance metrics and AI pedagogical diagnostic breakdown
            </p>
          </div>

          {/* Main Score Display */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto pt-2">
            {/* Score Percentage */}
            <div className="p-6 bg-gradient-to-br from-indigo-50/80 to-blue-50/50 dark:from-indigo-950/40 dark:to-blue-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/40">
              <div className="text-4xl sm:text-5xl font-black text-indigo-600 dark:text-indigo-400">
                {scorePercent}%
              </div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1.5">
                Accuracy / Score
              </p>
            </div>

            {/* Total Obtained Marks */}
            <div className="p-6 bg-gradient-to-br from-emerald-50/80 to-teal-50/50 dark:from-emerald-950/40 dark:to-teal-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/40">
              <div className="text-4xl sm:text-5xl font-black text-emerald-600 dark:text-emerald-400">
                {totalEarnedMarks}
                <span className="text-xl sm:text-2xl text-emerald-400 dark:text-emerald-500 font-bold ml-1">
                  / {totalPossibleMarks}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1.5">
                Total Obtained Marks
              </p>
            </div>
          </div>

          {/* Negative Marking Rule Notice */}
          {report?.has_negative_marking && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl text-xs font-medium text-amber-800 dark:text-amber-300">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              Negative Marking Applied: deduction of {report.negative_mark ?? 0.25} marks per incorrect answer
            </div>
          )}

          {/* Action button to view full response review */}
          <div className="pt-2">
            <button
              onClick={handleOpenReview}
              disabled={loadingReview}
              className="btn-primary py-3 px-8 rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/25 inline-flex items-center gap-2.5"
            >
              {loadingReview ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Loading Responses…
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" /> Review Questions, Solutions &amp; Short Tricks
                </>
              )}
            </button>
          </div>
        </div>

        {/* 4-Column Key Metrics Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {/* Total Questions */}
          <div className="card p-5 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Questions
              </span>
              <HelpCircle className="h-4 w-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              {totalQuestions}
            </div>
            <p className="text-xs text-slate-400">Total paper count</p>
          </div>

          {/* Attempted Questions */}
          <div className="card p-5 border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/20 dark:bg-indigo-950/20 space-y-1">
            <div className="flex items-center justify-between text-indigo-500 dark:text-indigo-400">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                Attempted
              </span>
              <CheckSquare className="h-4 w-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-indigo-700 dark:text-indigo-300">
              {attemptedQuestions}
            </div>
            <p className="text-xs text-indigo-500 dark:text-indigo-400">
              {totalQuestions > 0 ? `${Math.round((attemptedQuestions / totalQuestions) * 100)}% attempted` : '0%'}
            </p>
          </div>

          {/* Wrong Questions */}
          <div className="card p-5 border border-rose-100 dark:border-rose-900/40 bg-rose-50/20 dark:bg-rose-950/20 space-y-1">
            <div className="flex items-center justify-between text-rose-500 dark:text-rose-400">
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                Wrong
              </span>
              <XCircle className="h-4 w-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-rose-600 dark:text-rose-400">
              {wrongQuestions}
            </div>
            <p className="text-xs text-rose-500 dark:text-rose-400">
              {attemptedQuestions > 0 ? `${Math.round((wrongQuestions / attemptedQuestions) * 100)}% error rate` : '0 wrong'}
            </p>
          </div>

          {/* Unattempted Questions */}
          <div className="card p-5 border border-amber-100 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/20 space-y-1">
            <div className="flex items-center justify-between text-amber-500 dark:text-amber-400">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                Unattempted
              </span>
              <MinusCircle className="h-4 w-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-amber-700 dark:text-amber-400">
              {unattemptedQuestions}
            </div>
            <p className="text-xs text-amber-500 dark:text-amber-400">Left unanswered</p>
          </div>
        </div>

        {/* Accuracy Progress Distribution Bar */}
        <div className="card p-6 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>Accuracy Breakdown</span>
            <span>
              {correctQuestions} Correct · {wrongQuestions} Wrong · {unattemptedQuestions} Skipped
            </span>
          </div>
          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
            {totalQuestions > 0 && (
              <>
                <div
                  style={{ width: `${(correctQuestions / totalQuestions) * 100}%` }}
                  className="bg-emerald-500 h-full"
                  title={`${correctQuestions} Correct`}
                />
                <div
                  style={{ width: `${(wrongQuestions / totalQuestions) * 100}%` }}
                  className="bg-rose-500 h-full"
                  title={`${wrongQuestions} Wrong`}
                />
                <div
                  style={{ width: `${(unattemptedQuestions / totalQuestions) * 100}%` }}
                  className="bg-amber-400 h-full"
                  title={`${unattemptedQuestions} Unattempted`}
                />
              </>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" /> Correct ({correctQuestions})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500 inline-block" /> Wrong ({wrongQuestions})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400 inline-block" /> Unattempted ({unattemptedQuestions})
            </span>
          </div>
        </div>

        {/* AI Pedagogical Insights & Suggestions */}
        <div className="card p-6 sm:p-8 border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  AI Pedagogical Suggestions
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Topic strength &amp; weakness diagnostics powered by Google Gemini AI
                </p>
              </div>
            </div>
            {isPending && (
              <span className="badge bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1.5 animate-pulse text-xs">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Generating AI Suggestions…
              </span>
            )}
          </div>

          {/* AI Narrative Summary */}
          {report?.ai_summary && (
            <div className="p-5 bg-gradient-to-r from-indigo-50/70 to-teal-50/50 dark:from-indigo-950/40 dark:to-teal-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 text-sm leading-relaxed text-slate-800 dark:text-slate-200 space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" /> Performance Assessment
              </span>
              <p className="pt-1">{report.ai_summary}</p>
            </div>
          )}

          {/* Strong / Weak Topic Suggestions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Strong Topics */}
            <div className="p-5 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Strong Topics
                </span>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                  Keep it up
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Areas where you showed firm mastery:</p>
              <div className="flex flex-wrap gap-2 pt-1">
                {report?.strong_topics && report.strong_topics.length > 0 ? (
                  report.strong_topics.map((t: string) => (
                    <span
                      key={t}
                      className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-medium text-xs rounded-xl shadow-sm flex items-center gap-1.5"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {t}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">No specific strong areas identified</span>
                )}
              </div>
            </div>

            {/* Weak Topics */}
            <div className="p-5 bg-rose-50/50 dark:bg-rose-950/30 rounded-2xl border border-rose-100 dark:border-rose-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" /> Weak Topics &amp; Revision Needed
                </span>
                <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/60 px-2 py-0.5 rounded-full">
                  Focus here
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Topics requiring focused review:</p>
              <div className="flex flex-wrap gap-2 pt-1">
                {report?.weak_topics && report.weak_topics.length > 0 ? (
                  report.weak_topics.map((t: string) => (
                    <span
                      key={t}
                      className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 font-medium text-xs rounded-xl shadow-sm flex items-center gap-1.5"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                      {t}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">Great job! No weak topics flagged</span>
                )}
              </div>
            </div>
          </div>

          {/* AI Recommended Practice & Topic Advice */}
          {report?.topic_advice && report.topic_advice.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> AI Practice Recommendations
              </h3>
              <div className="space-y-2.5">
                {report.topic_advice.map((adv: { topic: string; advice: string }, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs space-y-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                      <span className="font-bold text-slate-900 dark:text-white">{adv.topic}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed pl-3.5">
                      {adv.advice}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Back Link */}
        <div className="flex items-center justify-center gap-4 pt-4">
          <Link
            href="/dashboard"
            className="btn-primary inline-flex items-center gap-2 py-3 px-8 text-sm font-semibold shadow-lg shadow-indigo-600/25"
          >
            <span>Return to Dashboard</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Attempt Review Modal */}
        {selectedReview && (
          <AttemptReviewModal
            data={selectedReview}
            onClose={() => setSelectedReview(null)}
          />
        )}
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#090D16]">
          <div className="animate-spin rounded-full h-8 w-8 border-3 border-indigo-600 border-t-transparent" />
        </div>
      }
    >
      <ResultPageContent />
    </Suspense>
  );
}
