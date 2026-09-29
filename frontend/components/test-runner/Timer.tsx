'use client';
import { useServerTimer } from '@/lib/hooks/useServerTimer';
import { Clock } from 'lucide-react';

interface TimerProps {
  expiresAt: string;
  onExpire: () => void;
}

export default function Timer({ expiresAt, onExpire }: TimerProps) {
  const { formatted, isWarning, isCritical } = useServerTimer({ expiresAt, onExpire });

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-sm font-semibold transition-colors ${
      isCritical ? 'bg-red-100 text-red-700 animate-pulse' :
      isWarning ? 'bg-amber-100 text-amber-700' :
      'bg-gray-100 text-gray-700'
    }`}>
      <Clock className="h-4 w-4" />
      <span>{formatted()}</span>
    </div>
  );
}

