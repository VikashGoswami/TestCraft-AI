'use client';
import type { AttemptAnswer, QuestionState } from '@/lib/types';

interface QuestionPaletteProps {
  questions: { id: number; order_index: number }[];
  answers: Map<number, AttemptAnswer>;
  currentQuestionId: number;
  onNavigate: (questionId: number) => void;
}

const STATE_CONFIG: Record<QuestionState, { label: string; countClass: string }> = {
  not_visited: {
    label: 'Not Visited',
    countClass: 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
  },
  not_answered: {
    label: 'Not Answered',
    countClass: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400',
  },
  answered: {
    label: 'Answered',
    countClass: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400',
  },
  marked: {
    label: 'Marked for Review',
    countClass: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400',
  },
  answered_marked: {
    label: 'Answered & Marked',
    countClass: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400',
  },
};

export default function QuestionPalette({
  questions,
  answers,
  currentQuestionId,
  onNavigate,
}: QuestionPaletteProps) {
  const counts = {
    not_visited: 0,
    not_answered: 0,
    answered: 0,
    marked: 0,
    answered_marked: 0,
  };

  answers.forEach((a) => {
    if (counts[a.state] !== undefined) {
      counts[a.state]++;
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
          Question Palette
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">Click a number to navigate directly</p>
      </div>

      <div className="grid grid-cols-5 gap-2 max-h-64 overflow-y-auto pr-1">
        {questions.map((q, idx) => {
          const answer = answers.get(q.id);
          const state: QuestionState = answer?.state ?? 'not_visited';
          const isCurrent = q.id === currentQuestionId;
          const dataState = state.replace(/_/g, '-');

          return (
            <button
              key={q.id}
              onClick={() => onNavigate(q.id)}
              data-state={dataState}
              className={`qpalette__tile h-9 rounded-lg text-xs font-bold text-white flex items-center justify-center transition-all ${
                isCurrent
                  ? 'ring-2 ring-indigo-500 dark:ring-indigo-400 ring-offset-2 dark:ring-offset-slate-900 scale-105'
                  : 'hover:opacity-90'
              }`}
              title={`Question ${idx + 1}: ${STATE_CONFIG[state].label}`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* 5-State Legend */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2">
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
          Legend
        </p>
        {(Object.entries(STATE_CONFIG) as [QuestionState, { label: string; countClass: string }][]).map(
          ([state, config]) => (
            <div key={state} className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <div
                  className="qpalette__tile w-3.5 h-3.5 rounded text-white flex items-center justify-center text-[10px]"
                  data-state={state.replace(/_/g, '-')}
                />
                <span>{config.label}</span>
              </div>
              <span className={`px-1.5 py-0.5 rounded font-semibold text-[10px] ${config.countClass}`}>
                {counts[state]}
              </span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
