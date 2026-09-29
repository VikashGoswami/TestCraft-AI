'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import client from '@/lib/api/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { startAttempt } from '@/lib/api/attempts';
import type { Test } from '@/lib/types';
import {
  PlusCircle,
  FileText,
  Share2,
  BarChart2,
  Pencil,
  Trash2,
  Play,
  Sparkles,
  HelpCircle,
  Clock,
  Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function TestsListPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isStudent = user?.roles?.includes('student');

  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [startingId, setStartingId] = useState<number | null>(null);

  const fetchTests = () => {
    setLoading(true);
    client
      .get('/tests')
      .then((r) => setTests(r.data.data ?? r.data))
      .catch(() => toast.error('Failed to load tests'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Delete "${title}"? This action cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await client.delete(`/tests/${id}`);
      setTests((prev) => prev.filter((t) => t.id !== id));
      toast.success('Test deleted');
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const handleTakeTest = async (testId: number) => {
    setStartingId(testId);
    try {
      const res = await startAttempt(testId, {});
      sessionStorage.setItem(
        `attempt_${res.data.id}`,
        JSON.stringify({
          attempt: res.data,
          // @ts-ignore
          questions: res.data.test?.questions || [],
          answers: res.data.answers || [],
        })
      );
      router.push(`/take/direct/run?attemptId=${res.data.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not start test');
    } finally {
      setStartingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {isStudent ? 'Assigned Assessments' : 'Assessments & Tests'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isStudent
              ? 'Browse and take tests assigned to your classes'
              : 'Create, edit, share, and inspect candidate attempt results'}
          </p>
        </div>
        {!isStudent && (
          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard/question-paper"
              className="btn-secondary flex items-center gap-2 text-xs py-2.5"
            >
              <Sparkles className="h-4 w-4 text-teal-500" />
              <span>AI Paper Import</span>
            </Link>
            <Link
              href="/dashboard/tests/new"
              className="btn-primary flex items-center gap-2 text-xs py-2.5 shadow-md shadow-indigo-600/20"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Create Test</span>
            </Link>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-3 border-indigo-600 border-t-transparent" />
            <p className="text-xs text-slate-400">Loading assessments…</p>
          </div>
        </div>
      ) : tests.length === 0 ? (
        <div className="card p-12 sm:p-16 flex flex-col items-center gap-4 text-center border border-slate-200 dark:border-slate-800">
          <div className="p-4 bg-indigo-50 dark:bg-indigo-950/60 rounded-3xl text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
            <FileText className="h-8 w-8" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              {isStudent ? 'No assigned tests yet' : 'No assessments found'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-sm">
              {isStudent
                ? 'Assessments assigned to your enrolled class will appear here.'
                : 'Create your first test or upload an exam paper using AI Paper Import.'}
            </p>
          </div>
          {!isStudent && (
            <div className="flex items-center gap-3 mt-2">
              <Link
                href="/dashboard/question-paper"
                className="btn-secondary flex items-center gap-2 text-xs py-2.5"
              >
                <Sparkles className="h-4 w-4 text-teal-500" />
                <span>AI Paper Import</span>
              </Link>
              <Link
                href="/dashboard/tests/new"
                className="btn-primary flex items-center gap-2 text-xs py-2.5"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Create Test</span>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                <tr>
                  <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider">
                    Assessment Title
                  </th>
                  <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider hidden md:table-cell">
                    Questions
                  </th>
                  <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider hidden md:table-cell">
                    Duration
                  </th>
                  <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider hidden lg:table-cell">
                    Attempts
                  </th>
                  <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right px-5 py-3.5 font-semibold text-xs uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {tests.map((test) => (
                  <tr
                    key={test.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div>
                        {isStudent ? (
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {test.title}
                          </span>
                        ) : (
                          <Link
                            href={`/dashboard/tests/${test.id}/questions`}
                            className="font-semibold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          >
                            {test.title}
                          </Link>
                        )}
                        {test.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                            {test.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300 hidden md:table-cell">
                      <span className="inline-flex items-center gap-1 font-medium">
                        <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                        {test.questions_count ?? test.question_count ?? 0}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300 hidden md:table-cell">
                      <span className="inline-flex items-center gap-1 font-medium">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {test.duration_minutes} min
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300 hidden lg:table-cell">
                      <span className="inline-flex items-center gap-1 font-medium">
                        <Layers className="h-3.5 w-3.5 text-slate-400" />
                        {test.attempts_count ?? 0}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <VisibilityBadge visibility={test.visibility} />
                    </td>
                    <td className="px-5 py-4">
                      {isStudent ? (
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => handleTakeTest(test.id)}
                            disabled={startingId === test.id}
                            className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5"
                          >
                            <Play className="h-3.5 w-3.5" />
                            {startingId === test.id ? 'Starting…' : 'Take Test'}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleTakeTest(test.id)}
                            disabled={startingId === test.id}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                            title="Start Test"
                          >
                            <Play className="h-4 w-4" />
                          </button>
                          <Link
                            href={`/dashboard/tests/${test.id}/edit`}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Edit Settings"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <Link
                            href={`/dashboard/tests/${test.id}/questions`}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Manage Questions"
                          >
                            <FileText className="h-4 w-4" />
                          </Link>
                          <Link
                            href={`/dashboard/tests/${test.id}/share`}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                            title="Share Link"
                          >
                            <Share2 className="h-4 w-4" />
                          </Link>
                          <Link
                            href={`/dashboard/tests/${test.id}/results`}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="View Results"
                          >
                            <BarChart2 className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(test.id, test.title)}
                            disabled={deletingId === test.id}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
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

function VisibilityBadge({ visibility }: { visibility: string }) {
  const map: Record<string, { label: string; classes: string }> = {
    public: {
      label: 'Public',
      classes:
        'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800',
    },
    private: {
      label: 'Private',
      classes:
        'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    },
    link_only: {
      label: 'Link Only',
      classes:
        'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-400 dark:border-indigo-800',
    },
    published: {
      label: 'Published',
      classes:
        'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800',
    },
    draft: {
      label: 'Draft',
      classes:
        'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800',
    },
  };
  const badge = map[visibility] ?? {
    label: visibility,
    classes:
      'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.classes}`}
    >
      {badge.label}
    </span>
  );
}
