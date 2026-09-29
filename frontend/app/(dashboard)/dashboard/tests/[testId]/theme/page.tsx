'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getTest } from '@/lib/api/tests';
import type { Test } from '@/lib/types';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ThemeConfigurator from '@/components/theme-builder/ThemeConfigurator';

export default function ThemePage() {
  const { testId } = useParams() as { testId: string };
  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchThemeData = () => {
    getTest(Number(testId))
      .then((res) => {
        setTest((res as any)?.data ?? res);
      })
      .catch(() => toast.error('Failed to load test settings'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchThemeData();
  }, [testId]);

  if (loading) {
    return (
      <div className="p-8 min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/tests" className="btn-secondary p-2.5">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Custom Exam Theming</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{test?.title}</p>
        </div>
      </div>

      <ThemeConfigurator
        testId={Number(testId)}
        initialTheme={test?.theme}
        onSaved={fetchThemeData}
      />
    </div>
  );
}
