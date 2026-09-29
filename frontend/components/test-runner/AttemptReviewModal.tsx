'use client';
import { useState } from 'react';
import type { AttemptReviewData, ReviewQuestion } from '@/lib/api/attempts';
import { getQuestionAiExplanation } from '@/lib/api/attempts';
import {
  X,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Lightbulb,
  BookOpen,
  Sparkles,
  RefreshCw,
  HelpCircle,
  Award,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AttemptReviewModalProps {
  data: AttemptReviewData;
  onClose: () => void;
}

export default function AttemptReviewModal({ data, onClose }: AttemptReviewModalProps) {
  const [filter, setFilter] = useState<'all' | 'correct' | 'wrong' | 'unattempted'>('all');
  const [questions, setQuestions] = useState<ReviewQuestion[]>(data.questions);
  const [loadingAiId, setLoadingAiId] = useState<number | null>(null);

  const filteredQuestions = questions.filter((q) => {
    if (filter === 'all') return true;
    return q.status === filter;
  });

  const handleGenerateAi = async (qId: number) => {
    setLoadingAiId(qId);
    try {
      const res = await getQuestionAiExplanation(qId);
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === qId ? { ...q, explanation: res.explanation, short_trick: res.short_trick } : q
        )
      );
      toast.success('AI explanation & short trick generated!');
    } catch {
      toast.error('Failed to generate AI solution.');
    } finally {
      setLoadingAiId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0c1220] rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-50/60 via-white to-teal-50/40 dark:from-indigo-950/40 dark:via-[#0c1220] dark:to-teal-950/20">
          <div>
            <div className="flex items-center gap-2">
              <span className="badge bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold uppercase tracking-wider">
                Full Response Review
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">· View Only</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1.5 tracking-tight">
              {data.test_title}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Candidate: <span className="font-semibold text-slate-800 dark:text-slate-200">{data.candidate_name}</span> ({data.candidate_email})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            title="Close Review"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Stats Summary Bar */}
        <div className="bg-slate-50/80 dark:bg-slate-900/60 px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 text-sm">
              <Award className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              Obtained Marks: {data.total_earned_marks} / {data.total_possible_marks} ({Math.round(data.score)}%)
            </span>
            {data.has_negative_marking && (
              <span className="text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                Negative mark: -{data.negative_mark}
              </span>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              All ({questions.length})
            </button>
            <button
              onClick={() => setFilter('correct')}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors flex items-center gap-1 ${
                filter === 'correct'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
              }`}
            >
              <CheckCircle2 className="h-3 w-3" />
              Correct ({data.correct_questions})
            </button>
            <button
              onClick={() => setFilter('wrong')}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors flex items-center gap-1 ${
                filter === 'wrong'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
              }`}
            >
              <XCircle className="h-3 w-3" />
              Wrong ({data.wrong_questions})
            </button>
            <button
              onClick={() => setFilter('unattempted')}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors flex items-center gap-1 ${
                filter === 'unattempted'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
              }`}
            >
              <MinusCircle className="h-3 w-3" />
              Skipped ({data.unattempted_questions})
            </button>
          </div>
        </div>

        {/* Question List Review Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {filteredQuestions.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <HelpCircle className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm">No questions match the selected filter.</p>
            </div>
          ) : (
            filteredQuestions.map((q) => {
              const isCorrect = q.status === 'correct';
              const isWrong = q.status === 'wrong';
              const isUnattempted = q.status === 'unattempted';

              return (
                <div
                  key={q.id}
                  className={`card p-5 sm:p-6 rounded-2xl border transition-all ${
                    isCorrect
                      ? 'border-emerald-200 dark:border-emerald-900/60 bg-white dark:bg-slate-900/90 shadow-sm'
                      : isWrong
                      ? 'border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-900/90 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90'
                  }`}
                >
                  {/* Question header row */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        Q{q.order_index}
                      </span>
                      <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs">
                        {q.topic || 'General'}
                      </span>
                      {q.difficulty && (
                        <span className="badge capitalize text-slate-500 dark:text-slate-400 text-xs">
                          {q.difficulty}
                        </span>
                      )}
                    </div>

                    {/* Question Status and Marks pill */}
                    <div className="flex items-center gap-2 text-xs">
                      {isCorrect && (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          Correct (+{q.marks_awarded} marks)
                        </span>
                      )}
                      {isWrong && (
                        <span className="inline-flex items-center gap-1 font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 px-2.5 py-1 rounded-full">
                          <XCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                          Wrong ({q.marks_awarded} marks)
                        </span>
                      )}
                      {isUnattempted && (
                        <span className="inline-flex items-center gap-1 font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-full">
                          <MinusCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                          Unattempted (0 marks)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Text */}
                  <p className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base leading-relaxed mb-4">
                    {q.question_text}
                  </p>

                  {/* Options List */}
                  <div className="space-y-2 mb-5">
                    {q.options.map((opt, optIdx) => {
                      const isCandidateSelected = q.selected_option_id === opt.id;
                      const isCorrectAnswer = opt.is_correct;

                      let rowStyle =
                        'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300';
                      if (isCorrectAnswer) {
                        rowStyle =
                          'border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 font-semibold';
                      } else if (isCandidateSelected && !isCorrectAnswer) {
                        rowStyle =
                          'border-rose-400 dark:border-rose-600 bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200 font-semibold';
                      }

                      return (
                        <div
                          key={opt.id}
                          className={`p-3 rounded-xl border text-xs sm:text-sm flex items-center justify-between transition-colors ${rowStyle}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`h-5 w-5 rounded-full flex items-center justify-center font-bold text-[11px] ${
                                isCorrectAnswer
                                  ? 'bg-emerald-600 text-white'
                                  : isCandidateSelected
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{opt.option_text}</span>
                          </div>

                          <div className="flex items-center gap-1.5 font-bold text-xs flex-shrink-0 ml-2">
                            {isCorrectAnswer && (
                              <span className="text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                Correct Answer
                              </span>
                            )}
                            {isCandidateSelected && !isCorrectAnswer && (
                              <span className="text-rose-700 dark:text-rose-300 flex items-center gap-1">
                                <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                                Your Choice
                              </span>
                            )}
                            {isCandidateSelected && isCorrectAnswer && (
                              <span className="text-emerald-700 dark:text-emerald-300 text-[11px]">
                                (Your Choice)
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Detailed Explanation & Remember Short Trick Section */}
                  <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                    {/* Step-by-Step Detailed Solution */}
                    {q.explanation ? (
                      <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-xl space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                          <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                          <span>Detailed Step-by-Step Solution:</span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line pl-5">
                          {q.explanation}
                        </p>
                      </div>
                    ) : null}

                    {/* Remember Short Trick / Key Concept Box */}
                    {q.short_trick ? (
                      <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50/50 dark:from-amber-950/40 dark:to-orange-950/20 border border-amber-200/80 dark:border-amber-800/60 rounded-xl space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                          <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          <span>💡 Remember Short Trick / Key Concept:</span>
                        </div>
                        <p className="text-xs text-amber-950 dark:text-amber-200 leading-relaxed font-medium pl-5">
                          {q.short_trick}
                        </p>
                      </div>
                    ) : null}

                    {/* If neither explanation nor short trick is yet cached, show button to generate with Gemini AI */}
                    {!q.explanation && !q.short_trick && (
                      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Need explanation or shortcut trick for this question?
                        </span>
                        <button
                          onClick={() => handleGenerateAi(q.id)}
                          disabled={loadingAiId === q.id}
                          className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400"
                        >
                          {loadingAiId === q.id ? (
                            <>
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Generating…
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3.5 w-3.5 text-teal-400" /> Generate AI Solution &amp; Short Trick
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            All solutions and shortcuts verified by TestCraft-AI pedagogical engine.
          </p>
          <button onClick={onClose} className="btn-secondary py-2 px-5 text-xs font-semibold">
            Close Review
          </button>
        </div>
      </div>
    </div>
  );
}
