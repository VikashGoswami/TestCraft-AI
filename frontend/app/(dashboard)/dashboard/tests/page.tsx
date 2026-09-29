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
  Eye,
  Share2,
  BarChart2,
  Pencil,
  Trash2,
  ChevronRight,
  Play,
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
      .then(r => setTests(r.data.data ?? r.data))
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
      setTests(prev => prev.filter(t => t.id !== id));
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
        }),
      );
      router.push(`/take/direct/run?attemptId=${res.data.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not start test');
    } finally {
      setStartingId(null);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isStudent ? 'Assigned Tests' : 'Tests'}</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {isStudent ? 'Browse and take tests assigned to your class' : 'Manage your MCQ tests'}
          </p>
        </div>
        {!isStudent && (
          <Link href="/dashboard/tests/new" className="btn-primary flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Create Test
          </Link>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : tests.length === 0 ? (
        <div className="card p-16 flex flex-col items-center gap-4 text-center">
          <div className="p-4 bg-blue-50 rounded-full">
            <FileText className="h-8 w-8 text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{isStudent ? 'No assigned tests yet' : 'No tests yet'}</h3>
            <p className="text-gray-500 text-sm mt-1">
              {isStudent ? 'Tests assigned to your enrolled classes will appear here.' : 'Create your first test to get started.'}
            </p>
          </div>
          {!isStudent && (
            <Link href="/dashboard/tests/new" className="btn-primary flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Create Test
            </Link>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3.5 font-medium text-gray-600">Title</th>
                <th className="text-left px-5 py-3.5 font-medium text-gray-600 hidden md:table-cell">
                  Questions
                </th>
                <th className="text-left px-5 py-3.5 font-medium text-gray-600 hidden md:table-cell">
                  Duration
                </th>
                <th className="text-left px-5 py-3.5 font-medium text-gray-600 hidden lg:table-cell">
                  Attempts
                </th>
                <th className="text-left px-5 py-3.5 font-medium text-gray-600">Status</th>
                <th className="text-right px-5 py-3.5 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tests.map(test => (
                <tr key={test.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div>
                      {isStudent ? (
                        <span className="font-medium text-gray-900">
                          {test.title}
                        </span>
                      ) : (
                        <Link
                          href={`/dashboard/tests/${test.id}/questions`}
                          className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                        >
                          {test.title}
                        </Link>
                      )}
                      {test.description && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{test.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600 hidden md:table-cell">
                    {test.questions_count ?? test.question_count ?? 0}
                  </td>
                  <td className="px-5 py-4 text-gray-600 hidden md:table-cell">
                    {test.duration_minutes} min
                  </td>
                  <td className="px-5 py-4 text-gray-600 hidden lg:table-cell">
                    {test.attempts_count ?? 0}
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
                          className="p-1.5 text-gray-400 hover:text-green-600 rounded-md hover:bg-green-50"
                          title="Start Test"
                        >
                          <Play className="h-4 w-4" />
                        </button>
                        <Link
                          href={`/dashboard/tests/${test.id}/edit`}
                          className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/dashboard/tests/${test.id}/questions`}
                          className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100"
                          title="Questions"
                        >
                          <FileText className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/dashboard/tests/${test.id}/share`}
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50"
                          title="Share"
                        >
                          <Share2 className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/dashboard/tests/${test.id}/results`}
                          className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100"
                          title="Results"
                        >
                          <BarChart2 className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(test.id, test.title)}
                          disabled={deletingId === test.id}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50"
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
      )}
    </div>
  );
}

function VisibilityBadge({ visibility }: { visibility: string }) {
  const map: Record<string, { label: string; classes: string }> = {
    public: { label: 'Public', classes: 'bg-green-100 text-green-700' },
    private: { label: 'Private', classes: 'bg-gray-100 text-gray-600' },
    link_only: { label: 'Link Only', classes: 'bg-blue-100 text-blue-700' },
    published: { label: 'Published', classes: 'bg-green-100 text-green-700' },
    draft: { label: 'Draft', classes: 'bg-amber-100 text-amber-700' },
  };
  const badge = map[visibility] ?? { label: visibility, classes: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.classes}`}>
      {badge.label}
    </span>
  );
}

