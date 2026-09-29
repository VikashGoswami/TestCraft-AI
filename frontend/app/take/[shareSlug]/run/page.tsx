'use client';
import { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import type { Attempt, Question, AttemptAnswer } from '@/lib/types';
import { getAttempt } from '@/lib/api/attempts';
import TestRunner from '@/components/test-runner/TestRunner';
import toast from 'react-hot-toast';

function RunPageContent() {
  const { shareSlug } = useParams() as { shareSlug: string };
  const searchParams = useSearchParams();
  const attemptId = searchParams.get('attemptId');

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<AttemptAnswer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!attemptId) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      // 1. Try sessionStorage first
      const stored = typeof window !== 'undefined' ? sessionStorage.getItem(`attempt_${attemptId}`) : null;
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.attempt && parsed.questions?.length > 0) {
            setAttempt(parsed.attempt);
            setQuestions(parsed.questions);
            setAnswers(parsed.answers || []);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error('Failed to parse attempt data from storage', err);
        }
      }

      // 2. Fallback to API if not in storage or questions array was empty
      try {
        const res = await getAttempt(Number(attemptId));
        setAttempt(res.data);
        // @ts-ignore
        setQuestions(res.data.test?.questions || []);
        // @ts-ignore
        setAnswers(res.data.answers || []);
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to load test attempt');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [attemptId]);

  if (loading || !attempt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#090D16]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <TestRunner
      attempt={attempt}
      questions={questions}
      initialAnswers={answers}
      shareSlug={shareSlug}
      templateKey={attempt.test?.theme?.template_key || 'focused'}
    />
  );
}

export default function RunPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#090D16]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      }
    >
      <RunPageContent />
    </Suspense>
  );
}
