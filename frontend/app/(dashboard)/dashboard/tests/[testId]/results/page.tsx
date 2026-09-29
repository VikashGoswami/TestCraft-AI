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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          <p className="text-sm text-gray-500 font-medium">Loading test attempts &amp; scores…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/tests" className="btn-secondary p-2.5 rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Candidate Attempts &amp; Results</h1>
            <p className="text-sm text-gray-500">{test?.title}</p>
          </div>
        </div>

        {/* Total stats pill */}
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-2xs text-xs font-semibold text-gray-600">
          <span>Total Attempts: <strong className="text-gray-900">{attempts.length}</strong></span>
          <span>·</span>
          <span>
            Passing Score:{' '}
            <strong className="text-gray-900">
              {test?.passing_score != null ? `${test.passing_score}%` : 'None'}
            </strong>
          </span>
          {test?.has_negative_marking && (
            <>
              <span>·</span>
              <span className="text-amber-700">
                Negative Deduction: -{test.negative_mark ?? 0.25}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Attempts Table */}
      <div className="card overflow-hidden shadow-xs border border-gray-100 rounded-2xl bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="p-4">Candidate</th>
                <th className="p-4">Status</th>
                <th className="p-4">Obtained Marks</th>
                <th className="p-4">Score %</th>
                <th className="p-4">Accuracy Breakdown</th>
                <th className="p-4">Submitted At</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {attempts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-400">
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

                  const earned = att.total_earned_marks != null ? att.total_earned_marks : (att.score ?? '—');
                  const possible = att.total_possible_marks != null ? att.total_possible_marks : (att.total_questions ?? '—');
                  const isSubmitted = att.status === 'submitted';
                  const isReviewLoading = loadingReviewId === att.id;

                  return (
                    <tr key={att.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* Candidate */}
                      <td className="p-4">
                        <div className="font-bold text-gray-900">{name}</div>
                        <div className="text-xs text-gray-400">{email}</div>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        {att.status === 'submitted' ? (
                          <span className="badge bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit text-xs font-semibold">
                            <CheckCircle className="h-3 w-3 text-emerald-600" /> Submitted
                          </span>
                        ) : att.status === 'in_progress' ? (
                          <span className="badge bg-amber-100 text-amber-800 flex items-center gap-1 w-fit text-xs font-semibold">
                            <Clock className="h-3 w-3 text-amber-600" /> In Progress
                          </span>
                        ) : (
                          <span className="badge bg-red-100 text-red-800 flex items-center gap-1 w-fit text-xs font-semibold">
                            <XCircle className="h-3 w-3 text-red-600" /> Expired
                          </span>
                        )}
                      </td>

                      {/* Obtained Marks */}
                      <td className="p-4">
                        {isSubmitted ? (
                          <div className="font-extrabold text-emerald-700 text-base">
                            {earned}
                            <span className="text-xs text-gray-400 font-semibold ml-1">
                              / {possible}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">Pending</span>
                        )}
                      </td>

                      {/* Score % */}
                      <td className="p-4">
                        {att.score != null ? (
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 text-base">
                              {Math.round(att.score)}%
                            </span>
                            {test?.passing_score != null && (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isPassed
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {isPassed ? 'PASS' : 'FAIL'}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      {/* Questions Breakdown */}
                      <td className="p-4 text-xs">
                        {isSubmitted ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              {att.correct_count ?? 0} Correct
                            </span>
                            <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded font-semibold">
                              <XCircle className="h-3 w-3 text-rose-600" />
                              {att.wrong_count ?? 0} Wrong
                            </span>
                            <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-semibold">
                              <MinusCircle className="h-3 w-3 text-amber-600" />
                              {att.unattempted_count ?? 0} Skipped
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">Test in progress</span>
                        )}
                      </td>

                      {/* Submitted At */}
                      <td className="p-4 text-gray-500 text-xs">
                        {att.submitted_at ? new Date(att.submitted_at).toLocaleString() : '—'}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        {isSubmitted ? (
                          <button
                            onClick={() => handleOpenReview(att.id)}
                            disabled={isReviewLoading}
                            className="btn-secondary inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold shadow-2xs hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors"
                          >
                            {isReviewLoading ? (
                              <>
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Loading…
                              </>
                            ) : (
                              <>
                                <Eye className="h-3.5 w-3.5 text-blue-600" /> View Responses
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No responses</span>
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
