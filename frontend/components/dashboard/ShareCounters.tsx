'use client';
import type { TestShare } from '@/lib/types';
import { Eye, Play, CheckCircle, Users } from 'lucide-react';

interface ShareCountersProps {
  share: TestShare;
}

export default function ShareCounters({ share }: ShareCountersProps) {
  const metrics = [
    { label: 'Views', value: share.view_count, icon: <Eye className="h-4 w-4" />, color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60' },
    { label: 'Started', value: share.start_count, icon: <Play className="h-4 w-4" />, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60' },
    { label: 'Completed', value: share.completion_count, icon: <CheckCircle className="h-4 w-4" />, color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60' },
    {
      label: 'Remaining',
      value: share.remaining_slots != null ? share.remaining_slots : '∞',
      icon: <Users className="h-4 w-4" />,
      color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {metrics.map(({ label, value, icon, color }) => (
        <div key={label} className="rounded-xl p-3 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col items-center gap-1">
          <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
          <span className="text-xl font-bold text-slate-900 dark:text-white">{value}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</span>
        </div>
      ))}
    </div>
  );
}
