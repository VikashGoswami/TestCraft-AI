'use client';
import type { Question } from '@/lib/types';

interface QuestionCardProps {
  question: Question;
  selectedOptionId: number | null;
  onSelect: (optionId: number) => void;
  questionNumber: number;
  totalQuestions: number;
}

export default function QuestionCard({
  question,
  selectedOptionId,
  onSelect,
  questionNumber,
  totalQuestions,
}: QuestionCardProps) {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Question {questionNumber} of {totalQuestions}
        </span>
        <div className="flex items-center gap-2">
          {question.difficulty && (
            <span
              className={`badge capitalize border ${
                question.difficulty === 'easy'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800'
                  : question.difficulty === 'medium'
                  ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800'
                  : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800'
              }`}
            >
              {question.difficulty}
            </span>
          )}
          <span className="badge bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-400 dark:border-indigo-800">
            {question.topic}
          </span>
        </div>
      </div>

      <div className="text-slate-900 dark:text-white text-base sm:text-lg leading-relaxed font-semibold">
        {question.question_text}
      </div>

      <div className="space-y-3">
        {question.options.map((option, idx) => {
          const isSelected = selectedOptionId === option.id;
          return (
            <button
              key={option.id}
              onClick={() => onSelect(option.id)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3.5 ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-100 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 text-slate-800 dark:text-slate-200'
              }`}
            >
              <span
                className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors mt-0.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                {letters[idx] ?? idx + 1}
              </span>
              <span className="text-sm sm:text-base leading-relaxed">{option.option_text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
