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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 via-white to-purple-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="badge bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider">
                Full Response Review
              </span>
              <span className="text-xs text-gray-500 font-medium">· View Only</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mt-1">{data.test_title}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Candidate: <span className="font-semibold text-gray-800">{data.candidate_name}</span> ({data.candidate_email})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            title="Close Review"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Stats Summary Bar */}
        <div className="bg-gray-50/80 px-6 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 font-bold text-gray-800 text-sm">
              <Award className="h-4 w-4 text-blue-600" />
              Obtained Marks: {data.total_earned_marks} / {data.total_possible_marks} ({Math.round(data.score)}%)
            </span>
            {data.has_negative_marking && (
              <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-amber-600" />
                Negative mark: -{data.negative_mark}
              </span>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-gray-200/80 shadow-2xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg font-semibold text-xs transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All ({data.total_questions})
            </button>
            <button
              onClick={() => setFilter('correct')}
              className={`px-3 py-1 rounded-lg font-semibold text-xs flex items-center gap-1 transition-colors ${
                filter === 'correct'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <CheckCircle2 className="h-3 w-3" /> Correct ({data.correct_questions})
            </button>
            <button
              onClick={() => setFilter('wrong')}
              className={`px-3 py-1 rounded-lg font-semibold text-xs flex items-center gap-1 transition-colors ${
                filter === 'wrong'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              <XCircle className="h-3 w-3" /> Wrong ({data.wrong_questions})
            </button>
            <button
              onClick={() => setFilter('unattempted')}
              className={`px-3 py-1 rounded-lg font-semibold text-xs flex items-center gap-1 transition-colors ${
                filter === 'unattempted'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              <MinusCircle className="h-3 w-3" /> Skipped ({data.unattempted_questions})
            </button>
          </div>
        </div>

        {/* Scrollable Questions List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {filteredQuestions.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              No questions found for the selected filter.
            </div>
          ) : (
            filteredQuestions.map((q) => {
              const isCorrect = q.status === 'correct';
              const isWrong = q.status === 'wrong';
              const isUnattempted = q.status === 'unattempted';
              const isAiLoading = loadingAiId === q.id;

              return (
                <div
                  key={q.id}
                  className={`card p-6 border rounded-2xl space-y-4 shadow-xs transition-all ${
                    isCorrect
                      ? 'border-emerald-100 bg-white hover:border-emerald-200'
                      : isWrong
                      ? 'border-rose-100 bg-white hover:border-rose-200'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  {/* Question Header & Status Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-gray-900 text-base">
                        Question {q.order_index}
                      </span>
                      <span className="badge bg-gray-100 text-gray-600 text-[11px] font-medium">
                        {q.topic}
                      </span>
                      <span className="badge bg-gray-50 text-gray-500 text-[10px] capitalize">
                        {q.difficulty}
                      </span>
                    </div>

                    {/* Result Status Indicator */}
                    <div className="flex items-center gap-2">
                      {isCorrect && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          Correct (+{q.marks_awarded} marks)
                        </span>
                      )}
                      {isWrong && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                          <XCircle className="h-3.5 w-3.5 text-rose-600" />
                          Wrong ({q.marks_awarded} marks)
                        </span>
                      )}
                      {isUnattempted && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                          <MinusCircle className="h-3.5 w-3.5 text-amber-600" />
                          Unattempted (0 marks)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Text */}
                  <p className="text-gray-900 font-medium text-sm leading-relaxed whitespace-pre-wrap">
                    {q.question_text}
                  </p>

                  {/* Options List */}
                  <div className="space-y-2 pt-1">
                    {q.options.map((opt) => {
                      const isOptionCorrect = opt.is_correct;
                      const isOptionSelected = opt.is_selected;

                      let rowStyle = 'bg-gray-50/60 border-gray-200 text-gray-700';
                      let badge = null;

                      if (isOptionCorrect && isOptionSelected) {
                        rowStyle = 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold shadow-2xs';
                        badge = (
                          <span className="ml-auto text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Correct Answer &amp; Your Choice
                          </span>
                        );
                      } else if (isOptionCorrect) {
                        rowStyle = 'bg-emerald-50/50 border-emerald-300 text-emerald-900 font-semibold';
                        badge = (
                          <span className="ml-auto text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Correct Answer
                          </span>
                        );
                      } else if (isOptionSelected) {
                        rowStyle = 'bg-rose-50 border-rose-300 text-rose-900 font-semibold';
                        badge = (
                          <span className="ml-auto text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <XCircle className="h-3 w-3" /> Your Choice (Incorrect)
                          </span>
                        );
                      }

                      return (
                        <div
                          key={opt.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border text-xs transition-colors ${rowStyle}`}
                        >
                          <span
                            className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                              isOptionCorrect
                                ? 'bg-emerald-600 text-white'
                                : isOptionSelected
                                ? 'bg-rose-600 text-white'
                                : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {opt.letter}
                          </span>
                          <span className="leading-relaxed">{opt.option_text}</span>
                          {badge}
                        </div>
                      );
                    })}
                  </div>

                  {/* Detailed Explanation Section */}
                  <div className="pt-2 space-y-3">
                    <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-blue-900 font-bold">
                        <span className="flex items-center gap-1.5">
                          <BookOpen className="h-4 w-4 text-blue-600" />
                          Detailed Solution &amp; Answer Key
                        </span>
                        <button
                          onClick={() => handleGenerateAi(q.id)}
                          disabled={isAiLoading}
                          className="text-[11px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg border border-purple-200 transition-colors flex items-center gap-1"
                        >
                          {isAiLoading ? (
                            <><RefreshCw className="h-3 w-3 animate-spin" /> Thinking…</>
                          ) : (
                            <><Sparkles className="h-3 w-3 text-purple-600" /> Ask AI to Explain</>
                          )}
                        </button>
                      </div>
                      <p className="text-gray-700 leading-relaxed pl-5">
                        {q.explanation}
                      </p>
                    </div>

                    {/* Remember Short Trick Box */}
                    {q.short_trick && (
                      <div className="p-4 bg-gradient-to-r from-amber-50/70 to-yellow-50/50 border border-amber-200 rounded-xl text-xs space-y-1 text-amber-950">
                        <span className="font-extrabold text-amber-800 flex items-center gap-1.5 tracking-wide">
                          <Lightbulb className="h-4 w-4 text-amber-600 fill-amber-500" />
                          REMEMBER SHORT TRICK / KEY CONCEPT
                        </span>
                        <p className="font-medium text-amber-900 leading-relaxed pl-5">
                          {q.short_trick}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50 text-xs text-gray-500">
          <span>
            Showing {filteredQuestions.length} of {data.total_questions} questions
          </span>
          <button onClick={onClose} className="btn-primary py-2 px-5 text-xs font-semibold rounded-xl">
            Close Review
          </button>
        </div>
      </div>
    </div>
  );
}
