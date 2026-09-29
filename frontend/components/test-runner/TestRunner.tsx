'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Attempt, Question, AttemptAnswer } from '@/lib/types';
import { useAttemptState } from '@/lib/hooks/useAttemptState';
import { useAutosave } from '@/lib/hooks/useAutosave';
import { submitAttempt } from '@/lib/api/attempts';
import QuestionCard from './QuestionCard';
import QuestionPalette from './QuestionPalette';
import Timer from './Timer';
import Logo from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import toast from 'react-hot-toast';
import {
  ChevronLeft,
  ChevronRight,
  Bookmark,
  RotateCcw,
  Send,
  FileText,
  HelpCircle,
  X,
  User as UserIcon,
} from 'lucide-react';

interface TestRunnerProps {
  attempt: Attempt;
  questions: Question[];
  initialAnswers: AttemptAnswer[];
  shareSlug: string;
  templateKey?: string;
}

export default function TestRunner({
  attempt,
  questions,
  initialAnswers,
  shareSlug,
  templateKey = 'focused',
}: TestRunnerProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [showQuestionPaperModal, setShowQuestionPaperModal] = useState(false);

  const { answers, currentQuestionId, currentAnswer, dispatch, navigateTo } = useAttemptState({
    attemptId: attempt.id,
    initialAnswers,
  });
  const { save, isStale } = useAutosave({ attemptId: attempt.id });

  const currentQuestionIndex = questions.findIndex((q) => q.id === currentQuestionId);
  const currentQuestion = questions[currentQuestionIndex] ?? questions[0];

  // Distinct sections/topics from questions for TCS iON style tabs
  const sections = useMemo(() => {
    const set = new Set<string>();
    questions.forEach((q) => set.add(q.topic || 'General'));
    return Array.from(set);
  }, [questions]);

  const activeSection = currentQuestion?.topic || 'General';

  const handleOptionSelect = useCallback(
    (optionId: number) => {
      save(currentQuestionId, optionId);
      dispatch(currentQuestionId, 'save', optionId);
    },
    [currentQuestionId, save, dispatch],
  );

  const handleSaveAndNext = async () => {
    const selected = currentAnswer?.selected_option_id ?? null;
    if (selected) {
      await dispatch(currentQuestionId, 'save', selected);
    }
    const nextQ = questions[currentQuestionIndex + 1];
    if (nextQ) {
      await navigateTo(nextQ.id);
    }
  };

  const handleMarkAndNext = async () => {
    const selected = currentAnswer?.selected_option_id ?? null;
    await dispatch(currentQuestionId, 'mark', selected);
    const nextQ = questions[currentQuestionIndex + 1];
    if (nextQ) {
      await navigateTo(nextQ.id);
    }
  };

  const handleClear = async () => {
    await dispatch(currentQuestionId, 'clear');
  };

  const handleSubmit = async () => {
    if (isStale()) {
      toast.error('Reconnecting… please wait a few seconds and try submitting again.');
      return;
    }
    setSubmitting(true);
    try {
      await submitAttempt(attempt.id);
      router.push(`/take/${shareSlug}/result?attemptId=${attempt.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Failed to submit test');
    } finally {
      setSubmitting(false);
      setShowConfirm(false);
    }
  };

  const handleExpire = useCallback(() => {
    toast.error("Time is up! Auto-submitting your test…");
    handleSubmit();
  }, [attempt.id, shareSlug]);

  if (!currentQuestion) {
    return <div className="min-h-screen flex items-center justify-center">Loading questions…</div>;
  }

  const unansweredCount = Array.from(answers.values()).filter(
    (a) => a.state === 'not_visited' || a.state === 'not_answered',
  ).length;

  const candidateName = attempt.user?.name ?? attempt.guest_name ?? 'Candidate';

  /* ──────────────────────────────────────────────────────────────────────────
     TEMPLATE A: Corporate Assessment (TCS iON Dense Multi-Panel Layout)
     ────────────────────────────────────────────────────────────────────────── */
  if (templateKey === 'corporate') {
    return (
      <div className="test-runner min-h-screen flex flex-col bg-slate-200 text-slate-800" data-template="corporate">
        {/* Modals */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white border-2 border-slate-400 p-6 max-w-md w-full shadow-2xl rounded">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Confirm Assessment Submission</h3>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                You are about to finish and submit your exam. Unanswered questions:{' '}
                <strong className="text-red-600">{unansweredCount}</strong> out of {questions.length}.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 border border-slate-300 text-xs font-semibold bg-slate-100 hover:bg-slate-200 flex-1"
                >
                  Return to Test
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex-1"
                >
                  {submitting ? 'Submitting…' : 'Confirm Submission'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showInstructionsModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-slate-300 p-6 max-w-lg w-full rounded shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-bold text-sm text-slate-900">General Assessment Instructions</h3>
                <button onClick={() => setShowInstructionsModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="text-xs text-slate-600 space-y-2">
                <p>1. The countdown timer in the top strip shows the remaining time available to you.</p>
                <p>2. To select an answer, click on the option button. Click &ldquo;Clear Response&rdquo; to deselect.</p>
                <p>3. Click &ldquo;Save &amp; Next&rdquo; to save your answer and move to the next question.</p>
                <p>4. Click &ldquo;Mark for Review &amp; Next&rdquo; to save for later review.</p>
              </div>
            </div>
          </div>
        )}

        {showQuestionPaperModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-slate-300 p-6 max-w-3xl w-full max-h-[85vh] flex flex-col rounded shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-bold text-sm text-slate-900">Question Paper View</h3>
                <button onClick={() => setShowQuestionPaperModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 text-xs">
                {questions.map((q, idx) => (
                  <div key={q.id} className="p-3 bg-slate-50 border border-slate-200 rounded">
                    <p className="font-bold text-slate-800">Q{idx + 1}. {q.question_text}</p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-slate-600">
                      {q.options.map((opt, i) => (
                        <li key={opt.id}>{String.fromCharCode(65 + i)}. {opt.option_text}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 1. TCS iON Top Bar */}
        <header className="corporate-top-bar bg-blue-900 text-white px-6 py-2.5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <span className="font-bold tracking-wide text-sm">{attempt.test?.title}</span>
            <span className="text-[11px] bg-blue-950 px-2 py-0.5 rounded text-blue-200">
              Module: Assessment Console
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={() => setShowQuestionPaperModal(true)}
              className="flex items-center gap-1 hover:underline text-blue-200"
            >
              <FileText className="h-3.5 w-3.5" /> Question Paper
            </button>
            <button
              onClick={() => setShowInstructionsModal(true)}
              className="flex items-center gap-1 hover:underline text-blue-200"
            >
              <HelpCircle className="h-3.5 w-3.5" /> Instructions
            </button>
          </div>
        </header>

        {/* 2. Group & Section Tabs */}
        <div className="bg-slate-300 px-6 pt-2 flex items-center gap-1 border-b border-slate-400 text-xs">
          {sections.map((sec) => (
            <button
              key={sec}
              onClick={() => {
                const firstInSection = questions.find((q) => (q.topic || 'General') === sec);
                if (firstInSection) navigateTo(firstInSection.id);
              }}
              className={`px-4 py-2 font-bold transition-all rounded-t ${
                activeSection === sec
                  ? 'bg-white text-blue-900 border-t-2 border-blue-700 shadow-sm'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Section: {sec}
            </button>
          ))}
        </div>

        {/* 3. Meta Strip */}
        <div className="corporate-meta-strip bg-white px-6 py-2 flex items-center justify-between text-xs border-b border-slate-300">
          <div className="flex items-center gap-6">
            <span className="font-bold text-slate-700">
              Question Type: <span className="font-normal text-slate-600">Multiple Choice</span>
            </span>
            <span className="font-bold text-slate-700">
              Marks for correct answer: <span className="text-green-700">+1.0</span> | Negative Marks:{' '}
              <span className="text-red-600">0.0</span>
            </span>
          </div>
          <Timer expiresAt={attempt.expires_at} onExpire={handleExpire} />
        </div>

        {/* 4. Split Content & Corporate Sidebar */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Question Panel */}
          <main className="flex-1 p-6 overflow-y-auto flex flex-col justify-between">
            <div className="bg-white border border-slate-300 p-6 rounded shadow-xs">
              <QuestionCard
                question={currentQuestion}
                selectedOptionId={currentAnswer?.selected_option_id ?? null}
                onSelect={handleOptionSelect}
                questionNumber={currentQuestionIndex + 1}
                totalQuestions={questions.length}
              />
            </div>

            {/* Bottom Nav Action Bar */}
            <div className="bg-white border border-slate-300 p-3 rounded mt-4 flex items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleMarkAndNext}
                  className="px-3 py-2 bg-slate-100 border border-slate-300 hover:bg-slate-200 text-xs font-semibold text-purple-800 rounded flex items-center gap-1.5"
                >
                  <Bookmark className="h-3.5 w-3.5" /> Mark for Review &amp; Next
                </button>
                <button
                  onClick={handleClear}
                  className="px-3 py-2 bg-slate-100 border border-slate-300 hover:bg-slate-200 text-xs font-semibold text-slate-700 rounded flex items-center gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Clear Response
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (currentQuestionIndex > 0) navigateTo(questions[currentQuestionIndex - 1].id);
                  }}
                  disabled={currentQuestionIndex === 0}
                  className="px-4 py-2 bg-slate-100 border border-slate-300 hover:bg-slate-200 disabled:opacity-50 text-xs font-semibold rounded"
                >
                  Previous
                </button>
                <button
                  onClick={handleSaveAndNext}
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded flex items-center gap-1"
                >
                  Save &amp; Next <ChevronRight className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setShowConfirm(true)}
                  className="px-5 py-2 bg-green-700 hover:bg-green-800 text-white text-xs font-bold rounded flex items-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" /> Submit Assessment
                </button>
              </div>
            </div>
          </main>

          {/* Fixed Right Sidebar: Candidate Identity + Palette */}
          <aside className="w-80 corporate-sidebar bg-slate-100 border-l-2 border-slate-300 p-4 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              {/* Identity Block */}
              <div className="bg-white p-3 border border-slate-300 rounded flex items-center gap-3">
                <div className="h-12 w-12 bg-blue-100 text-blue-800 rounded border border-blue-300 flex items-center justify-center font-bold text-lg">
                  {candidateName[0]}
                </div>
                <div className="text-xs">
                  <p className="font-bold text-slate-900">{candidateName}</p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    ID: {attempt.user?.email || attempt.guest_email || `ATT-${attempt.id}`}
                  </p>
                </div>
              </div>

              {/* Grouped Palette */}
              <div className="bg-white p-4 border border-slate-300 rounded shadow-2xs">
                <QuestionPalette
                  questions={questions}
                  answers={answers}
                  currentQuestionId={currentQuestionId}
                  onNavigate={navigateTo}
                />
              </div>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  /* ──────────────────────────────────────────────────────────────────────────
     TEMPLATE B: Focused Practice (Minimal Single-Card CAT-Prep Layout)
     ────────────────────────────────────────────────────────────────────────── */
  return (
    <div className="test-runner min-h-screen flex flex-col bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100 transition-colors duration-200" data-template={templateKey}>
      {/* Submit Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Submit Your Assessment?</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              Are you sure you want to finish and submit? You have{' '}
              <strong className="text-amber-600 dark:text-amber-400">{unansweredCount}</strong> unanswered questions remaining out of {questions.length}.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="btn-secondary flex-1 py-2.5 text-xs font-semibold"
              >
                Return to Test
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-danger flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
              >
                {submitting ? 'Submitting…' : 'Yes, Submit Test'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="bg-white dark:bg-[#0c1220] border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-xs">
        <div className="flex items-center gap-4">
          <Logo size="sm" showTagline={false} href={null} />
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
          <div>
            <h1 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-tight">
              {attempt.test?.title}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Candidate: <span className="font-semibold text-slate-700 dark:text-slate-300">{candidateName}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Timer expiresAt={attempt.expires_at} onExpire={handleExpire} />
        </div>
      </header>

      {/* Main Runner Body */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto p-4 sm:p-6 gap-6">
        {/* Left: Question Card & Action Controls */}
        <div className="flex-1 flex flex-col justify-between space-y-6">
          <div className="card p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800">
            <QuestionCard
              question={currentQuestion}
              selectedOptionId={currentAnswer?.selected_option_id ?? null}
              onSelect={handleOptionSelect}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={questions.length}
            />
          </div>

          {/* Action Row */}
          <div className="card p-4 flex items-center justify-between gap-3 flex-wrap border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <button
                onClick={handleMarkAndNext}
                className="btn-secondary flex items-center gap-1.5 text-xs text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40"
              >
                <Bookmark className="h-4 w-4" />
                <span>Mark for Review &amp; Next</span>
              </button>
              <button
                onClick={handleClear}
                className="btn-secondary flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Clear Response</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (currentQuestionIndex > 0) {
                    navigateTo(questions[currentQuestionIndex - 1].id);
                  }
                }}
                disabled={currentQuestionIndex === 0}
                className="btn-secondary flex items-center gap-1 text-xs"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </button>
              <button
                onClick={handleSaveAndNext}
                className="btn-primary flex items-center gap-1 text-xs"
              >
                <span>Save &amp; Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowConfirm(true)}
                className="btn-danger flex items-center gap-1.5 text-xs"
              >
                <Send className="h-4 w-4" />
                <span>Submit Test</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Question Palette Sidebar */}
        <aside className="w-full lg:w-80 card p-6 shadow-sm flex flex-col justify-between border border-slate-200 dark:border-slate-800">
          <QuestionPalette
            questions={questions}
            answers={answers}
            currentQuestionId={currentQuestionId}
            onNavigate={navigateTo}
          />
        </aside>
      </div>
    </div>
  );
}
