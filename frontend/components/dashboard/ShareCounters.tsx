'use client';
import type { TestShare } from '@/lib/types';
import { Eye, Play, CheckCircle, Users } from 'lucide-react';

interface ShareCountersProps {
  share: TestShare;
}

export default function ShareCounters({ share }: ShareCountersProps) {
  const metrics = [
    { label: 'Views', value: share.view_count, icon: <Eye className="h-4 w-4" />, color: 'text-blue-600 bg-blue-50' },
    { label: 'Started', value: share.start_count, icon: <Play className="h-4 w-4" />, color: 'text-amber-600 bg-amber-50' },
    { label: 'Completed', value: share.completion_count, icon: <CheckCircle className="h-4 w-4" />, color: 'text-green-600 bg-green-50' },
    {
      label: 'Remaining',
      value: share.remaining_slots != null ? share.remaining_slots : '∞',
      icon: <Users className="h-4 w-4" />,
      color: 'text-purple-600 bg-purple-50',
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {metrics.map(({ label, value, icon, color }) => (
        <div key={label} className="rounded-lg p-3 border border-gray-100 flex flex-col items-center gap-1">
          <div className={`p-1.5 rounded-md ${color}`}>{icon}</div>
          <span className="text-xl font-bold text-gray-900">{value}</span>
          <span className="text-xs text-gray-500">{label}</span>
        </div>
      ))}
    </div>
  );
}

