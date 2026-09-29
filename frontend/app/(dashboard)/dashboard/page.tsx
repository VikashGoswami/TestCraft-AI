'use client';
import { useEffect, useState } from 'react';
import client from '@/lib/api/client';
import type { DashboardData } from '@/lib/types';
import { FileText, Users2, BarChart2, TrendingUp, GraduationCap, CheckCircle } from 'lucide-react';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client
      .get('/dashboard')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Failed to load dashboard data.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
      <p className="text-gray-500 mb-8">Here&apos;s an overview of your activity.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {/* Admin / Individual stats */}
        {'total_tests' in data && (
          <>
            <StatCard
              label="Total Tests"
              value={data.total_tests}
              icon={<FileText className="h-5 w-5" />}
              color="blue"
            />
            <StatCard
              label="Published Tests"
              value={data.published_tests}
              icon={<CheckCircle className="h-5 w-5" />}
              color="green"
            />
            <StatCard
              label="Total Attempts"
              value={data.total_attempts}
              icon={<Users2 className="h-5 w-5" />}
              color="purple"
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
              color="blue"
            />
            <StatCard
              label="Tests Created"
              value={data.test_count}
              icon={<FileText className="h-5 w-5" />}
              color="green"
            />
            <StatCard
              label="Total Attempts"
              value={data.total_attempts}
              icon={<BarChart2 className="h-5 w-5" />}
              color="purple"
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
              color="blue"
            />
            <StatCard
              label="Average Score"
              value={data.average_score != null ? `${Math.round(data.average_score)}%` : 'N/A'}
              icon={<TrendingUp className="h-5 w-5" />}
              color="green"
            />
          </>
        )}
      </div>

      {/* Recent activity — if API returns it */}
      {'recent_attempts' in data && Array.isArray(data.recent_attempts) && data.recent_attempts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Attempts</h2>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Test</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Participant</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Score</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(data.recent_attempts as any[]).map((attempt: any) => (
                  <tr key={attempt.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900 font-medium">{attempt.test?.title ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{attempt.user?.name ?? attempt.guest_name ?? 'Guest'}</td>
                    <td className="px-4 py-3 text-gray-900">
                      {attempt.score != null ? `${Math.round(attempt.score)}%` : '—'}
                    </td>
                    <td className="px-4 py-3">
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

const COLOR_MAP: Record<string, { bg: string; icon: string }> = {
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600' },
  green: { bg: 'bg-green-50', icon: 'text-green-600' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-600' },
};

function StatCard({
  label,
  value,
  icon,
  color = 'blue',
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
}) {
  const { bg, icon: iconColor } = COLOR_MAP[color] ?? COLOR_MAP.blue;
  return (
    <div className="card p-6 flex items-center gap-4">
      <div className={`p-2.5 rounded-xl ${bg} ${iconColor}`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: 'bg-green-100 text-green-700',
    in_progress: 'bg-amber-100 text-amber-700',
    started: 'bg-blue-100 text-blue-700',
    expired: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

