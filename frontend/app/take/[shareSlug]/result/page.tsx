'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getReport, getAttemptReview } from '@/lib/api/attempts';
import type { AttemptReport } from '@/lib/types';
import type { AttemptReviewData } from '@/lib/api/attempts';
import AttemptReviewModal from '@/components/test-runner/AttemptReviewModal';
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
          <p className="text-sm font-medium text-gray-500">Calculating score &amp; generating AI insights…</p>
        </div>
      </div>
    );
  }

  const isPending = report?.generation_status === 'pending';

  const totalQuestions = report?.total_questions ?? 0;
  const attemptedQuestions = report?.attempted_questions ?? 0;
  const correctQuestions = report?.correct_questions ?? 0;
  const wrongQuestions = report?.wrong_questions ?? 0;
  const unattemptedQuestions = report?.unattempted_questions ?? Math.max(0, totalQuestions - attemptedQuestions);
  const totalEarnedMarks = report?.total_earned_marks ?? 0;
  const totalPossibleMarks = report?.total_possible_marks ?? totalQuestions;
  const scorePercent = report?.score != null ? Math.round(report.score) : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header Assessment Title & Score Card */}
        <div className="card p-8 text-center space-y-6 shadow-sm border border-gray-100 bg-white rounded-2xl">
          <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Award className="h-8 w-8" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              Result Summary
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mt-2">
              {report?.test_title || 'Assessment Completed'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">Here is a detailed breakdown of your performance</p>
          </div>

          {/* Main Score Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto pt-2">
            {/* Score Percentage */}
            <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-2xl border border-blue-100/80">
              <div className="text-4xl md:text-5xl font-black text-blue-600">
                {scorePercent}%
              </div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
                Accuracy / Score
              </p>
            </div>

            {/* Total Obtained Marks */}
            <div className="p-5 bg-gradient-to-br from-emerald-50 to-green-50/50 rounded-2xl border border-green-100/80">
              <div className="text-4xl md:text-5xl font-black text-emerald-600">
                {totalEarnedMarks}
                <span className="text-xl md:text-2xl text-emerald-400 font-bold ml-1">
                  / {totalPossibleMarks}
                </span>
              </div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
                Total Obtained Marks
              </p>
            </div>
          </div>

          {/* Negative Marking Rule Notice if applied */}
          {report?.has_negative_marking && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs font-medium text-amber-800">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              Negative Marking Applied: deduction of {report.negative_mark ?? 0.25} marks per incorrect answer
            </div>
          )}

          {/* Action to view full responses */}
          <div className="pt-1">
            <button
              onClick={handleOpenReview}
              disabled={loadingReview}
              className="btn-primary py-3 px-8 rounded-xl text-sm font-bold inline-flex items-center gap-2.5 shadow-sm hover:shadow transition-all"
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {/* Total Questions */}
          <div className="card p-5 border border-gray-100 bg-white rounded-xl shadow-xs space-y-1">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Questions</span>
              <HelpCircle className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-2xl md:text-3xl font-bold text-gray-900">{totalQuestions}</div>
            <p className="text-xs text-gray-400">Total paper count</p>
          </div>

          {/* Attempted Questions */}
          <div className="card p-5 border border-blue-100 bg-blue-50/20 rounded-xl shadow-xs space-y-1">
            <div className="flex items-center justify-between text-blue-500">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">Attempted</span>
              <CheckSquare className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl md:text-3xl font-bold text-blue-700">{attemptedQuestions}</div>
            <p className="text-xs text-blue-500">
              {totalQuestions > 0 ? `${Math.round((attemptedQuestions / totalQuestions) * 100)}% attempted` : '0%'}
            </p>
          </div>

          {/* Wrong Questions */}
          <div className="card p-5 border border-red-100 bg-red-50/20 rounded-xl shadow-xs space-y-1">
            <div className="flex items-center justify-between text-red-500">
              <span className="text-xs font-semibold uppercase tracking-wider text-red-700">Wrong</span>
              <XCircle className="h-4 w-4 text-red-600" />
            </div>
            <div className="text-2xl md:text-3xl font-bold text-red-600">{wrongQuestions}</div>
            <p className="text-xs text-red-400">
              {attemptedQuestions > 0 ? `${Math.round((wrongQuestions / attemptedQuestions) * 100)}% of attempts` : '0 wrong'}
            </p>
          </div>

          {/* Unattempted Questions */}
          <div className="card p-5 border border-amber-100 bg-amber-50/20 rounded-xl shadow-xs space-y-1">
            <div className="flex items-center justify-between text-amber-500">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">Unattempted</span>
              <MinusCircle className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-2xl md:text-3xl font-bold text-amber-700">{unattemptedQuestions}</div>
            <p className="text-xs text-amber-500">Left unanswered</p>
          </div>
        </div>

        {/* Detailed Questions Progress Strip */}
        <div className="card p-5 bg-white border border-gray-100 rounded-xl shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
            <span>Accuracy Distribution</span>
            <span>{correctQuestions} Correct · {wrongQuestions} Wrong · {unattemptedQuestions} Skipped</span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
            {totalQuestions > 0 && (
              <>
                <div
                  style={{ width: `${(correctQuestions / totalQuestions) * 100}%` }}
                  className="bg-emerald-500 h-full"
                  title={`${correctQuestions} Correct`}
                />
                <div
                  style={{ width: `${(wrongQuestions / totalQuestions) * 100}%` }}
                  className="bg-red-500 h-full"
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
          <div className="flex items-center gap-4 text-xs text-gray-500 pt-1">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" /> Correct ({correctQuestions})</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500 inline-block" /> Wrong ({wrongQuestions})</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400 inline-block" /> Unattempted ({unattemptedQuestions})</span>
          </div>
        </div>

        {/* AI Pedagogical Insights & Suggestions Section */}
        <div className="card p-8 shadow-sm border border-gray-100 bg-white rounded-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">AI Pedagogical Suggestions</h2>
                <p className="text-xs text-gray-500">In-depth strength &amp; weakness analysis powered by Gemini AI</p>
              </div>
            </div>
            {isPending && (
              <span className="badge bg-amber-50 text-amber-600 flex items-center gap-1.5 animate-pulse text-xs">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Generating AI Suggestions…
              </span>
            )}
          </div>

          {/* AI Narrative Summary */}
          {report?.ai_summary && (
            <div className="p-5 bg-gradient-to-r from-blue-50/60 to-purple-50/40 rounded-xl border border-blue-100/80 text-sm leading-relaxed text-gray-800 space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" /> Performance Assessment
              </span>
              <p className="pt-1">{report.ai_summary}</p>
            </div>
          )}

          {/* Strong / Weak Topic Suggestions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Strong Topics */}
            <div className="p-5 bg-emerald-50/40 rounded-2xl border border-emerald-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Strong Topics
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Keep it up
                </span>
              </div>
              <p className="text-xs text-gray-500">Areas where you showed firm mastery and accuracy:</p>
              <div className="flex flex-wrap gap-2 pt-1">
                {report?.strong_topics && report.strong_topics.length > 0 ? (
                  report.strong_topics.map((t: string) => (
                    <span
                      key={t}
                      className="px-3 py-1.5 bg-white border border-emerald-200 text-emerald-800 font-medium text-xs rounded-lg shadow-2xs flex items-center gap-1"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {t}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400 italic">No specific strong areas identified yet</span>
                )}
              </div>
            </div>

            {/* Weak Topics */}
            <div className="p-5 bg-rose-50/40 rounded-2xl border border-rose-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-rose-600" /> Weak Topics &amp; Revision Needed
                </span>
                <span className="text-[11px] font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                  Focus here
                </span>
              </div>
              <p className="text-xs text-gray-500">Topics with errors or skipped questions requiring revision:</p>
              <div className="flex flex-wrap gap-2 pt-1">
                {report?.weak_topics && report.weak_topics.length > 0 ? (
                  report.weak_topics.map((t: string) => (
                    <span
                      key={t}
                      className="px-3 py-1.5 bg-white border border-rose-200 text-rose-800 font-medium text-xs rounded-lg shadow-2xs flex items-center gap-1"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                      {t}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400 italic">Great job! No weak topics flagged</span>
                )}
              </div>
            </div>
          </div>

          {/* AI Recommended Practice & Topic Advice */}
          {report?.topic_advice && report.topic_advice.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-blue-600" /> AI Practice Recommendations
              </h3>
              <div className="space-y-2.5">
                {report.topic_advice.map((adv: { topic: string; advice: string }, idx: number) => (
                  <div key={idx} className="p-4 bg-gray-50/80 border border-gray-200/70 rounded-xl text-xs space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-blue-600" />
                      <span className="font-bold text-gray-900">{adv.topic}</span>
                    </div>
                    <p className="text-gray-600 leading-relaxed pl-3.5">{adv.advice}</p>
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
            className="btn-primary inline-flex items-center gap-2 py-2.5 px-6 rounded-xl text-sm font-medium shadow-sm hover:shadow"
          >
            Go to Dashboard <ArrowRight className="h-4 w-4" />
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
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      }
    >
      <ResultPageContent />
    </Suspense>
  );
}
