'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getTest, getTestAttempts } from '@/lib/api/tests';
import { getAttemptReview } from '@/lib/api/attempts';
import type { AttemptReviewData } from '@/lib/api/attempts';
import type { Test } from '@/lib/types';
import AttemptReviewModal from '@/components/test-runner/AttemptReviewModal';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  RefreshCw,
  Award,
  CheckCircle2,
  MinusCircle,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';

export default function ResultsPage() {
  const { testId } = useParams() as { testId: string };
  const [test, setTest] = useState<Test | null>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Review modal state
  const [selectedReview, setSelectedReview] = useState<AttemptReviewData | null>(null);
  const [loadingReviewId, setLoadingReviewId] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([getTest(Number(testId)), getTestAttempts(Number(testId))])
      .then(([testRes, attemptsRes]) => {
        setTest((testRes as any)?.data ?? testRes);
        const list = (attemptsRes as any)?.data?.data ?? (attemptsRes as any)?.data ?? attemptsRes;
        setAttempts(Array.isArray(list) ? list : []);
      })
      .catch(() => toast.error('Failed to load results'))
      .finally(() => setLoading(false));
  }, [testId]);

  const handleOpenReview = async (attemptId: number) => {
    setLoadingReviewId(attemptId);
    try {
      const reviewData = await getAttemptReview(attemptId);
      setSelectedReview(reviewData);
    } catch {
      toast.error('Failed to load question responses.');
    } finally {
      setLoadingReviewId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-3 border-indigo-600 border-t-transparent mx-auto" />
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Loading test attempts &amp; scores…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/tests" className="btn-secondary p-2.5 rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Candidate Attempts &amp; Results
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{test?.title}</p>
          </div>
        </div>

        {/* Total stats pill */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-xs font-semibold text-slate-600 dark:text-slate-300">
          <span>
            Total Attempts:{' '}
            <strong className="text-slate-900 dark:text-white">{attempts.length}</strong>
          </span>
          <span>·</span>
          <span>
            Passing Score:{' '}
            <strong className="text-slate-900 dark:text-white">
              {test?.passing_score != null ? `${test.passing_score}%` : 'None'}
            </strong>
          </span>
          {test?.has_negative_marking && (
            <>
              <span>·</span>
              <span className="text-amber-700 dark:text-amber-400">
                Negative Deduction: -{test.negative_mark ?? 0.25}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Attempts Table */}
      <div className="card overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="p-4">Candidate</th>
                <th className="p-4">Status</th>
                <th className="p-4">Obtained Marks</th>
                <th className="p-4">Score %</th>
                <th className="p-4">Accuracy Breakdown</th>
                <th className="p-4">Submitted At</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
              {attempts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    No attempts recorded yet for this test.
                  </td>
                </tr>
              ) : (
                attempts.map((att) => {
                  const name = att.user?.name || att.guest_name || 'Anonymous Guest';
                  const email = att.user?.email || att.guest_email || '—';
                  const isPassed =
                    test?.passing_score != null && att.score != null
                      ? att.score >= test.passing_score
                      : true;

                  const earned =
                    att.total_earned_marks != null ? att.total_earned_marks : (att.score ?? '—');
                  const possible =
                    att.total_possible_marks != null
                      ? att.total_possible_marks
                      : (att.total_questions ?? '—');
                  const isSubmitted = att.status === 'submitted';
                  const isReviewLoading = loadingReviewId === att.id;

                  return (
                    <tr
                      key={att.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Candidate */}
                      <td className="p-4">
                        <div className="font-bold text-slate-900 dark:text-white">{name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{email}</div>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        {att.status === 'submitted' ? (
                          <span className="badge bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800 border flex items-center gap-1 w-fit text-xs font-semibold">
                            <CheckCircle className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /> Submitted
                          </span>
                        ) : att.status === 'in_progress' ? (
                          <span className="badge bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800 border flex items-center gap-1 w-fit text-xs font-semibold">
                            <Clock className="h-3 w-3 text-amber-600 dark:text-amber-400" /> In Progress
                          </span>
                        ) : (
                          <span className="badge bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800 border flex items-center gap-1 w-fit text-xs font-semibold">
                            <XCircle className="h-3 w-3 text-rose-600 dark:text-rose-400" /> Expired
                          </span>
                        )}
                      </td>

                      {/* Obtained Marks */}
                      <td className="p-4">
                        {isSubmitted ? (
                          <div className="font-extrabold text-emerald-600 dark:text-emerald-400 text-base">
                            {earned}
                            <span className="text-xs text-slate-400 font-semibold ml-1">
                              / {possible}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">Pending</span>
                        )}
                      </td>

                      {/* Score % */}
                      <td className="p-4">
                        {att.score != null ? (
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white text-base">
                              {Math.round(att.score)}%
                            </span>
                            {test?.passing_score != null && (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  isPassed
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800'
                                    : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800'
                                }`}
                              >
                                {isPassed ? 'PASS' : 'FAIL'}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Questions Breakdown */}
                      <td className="p-4 text-xs">
                        {isSubmitted ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded font-semibold">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                              {att.correct_count ?? 0} Correct
                            </span>
                            <span className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded font-semibold">
                              <XCircle className="h-3 w-3 text-rose-600 dark:text-rose-400" />
                              {att.wrong_count ?? 0} Wrong
                            </span>
                            <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded font-semibold">
                              <MinusCircle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                              {att.unattempted_count ?? 0} Skipped
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">Test in progress</span>
                        )}
                      </td>

                      {/* Submitted At */}
                      <td className="p-4 text-slate-500 dark:text-slate-400 text-xs">
                        {att.submitted_at ? new Date(att.submitted_at).toLocaleString() : '—'}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        {isSubmitted ? (
                          <button
                            onClick={() => handleOpenReview(att.id)}
                            disabled={isReviewLoading}
                            className="btn-secondary inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                          >
                            {isReviewLoading ? (
                              <>
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Loading…
                              </>
                            ) : (
                              <>
                                <Eye className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" /> View Responses
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No responses</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Responses Modal */}
      {selectedReview && (
        <AttemptReviewModal
          data={selectedReview}
          onClose={() => setSelectedReview(null)}
        />
      )}
    </div>
  );
}
