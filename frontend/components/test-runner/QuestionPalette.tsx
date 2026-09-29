'use client';
import type { AttemptAnswer, QuestionState } from '@/lib/types';

interface QuestionPaletteProps {
  questions: { id: number; order_index: number }[];
  answers: Map<number, AttemptAnswer>;
  currentQuestionId: number;
  onNavigate: (questionId: number) => void;
}

const STATE_CONFIG: Record<QuestionState, { label: string; countClass: string }> = {
  not_visited: { label: 'Not Visited', countClass: 'bg-gray-200 text-gray-700' },
  not_answered: { label: 'Not Answered', countClass: 'bg-red-100 text-red-700' },
  answered: { label: 'Answered', countClass: 'bg-green-100 text-green-700' },
  marked: { label: 'Marked for Review', countClass: 'bg-purple-100 text-purple-700' },
  answered_marked: { label: 'Answered & Marked', countClass: 'bg-violet-100 text-violet-700' },
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
        <h3 className="text-sm font-bold text-gray-900 mb-1">Question Palette</h3>
        <p className="text-xs text-gray-500">Click a number to navigate directly</p>
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
                isCurrent ? 'ring-2 ring-blue-600 ring-offset-2 scale-105' : 'hover:opacity-90'
              }`}
              title={`Question ${idx + 1}: ${STATE_CONFIG[state].label}`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* 5-State Legend */}
      <div className="border-t border-gray-100 pt-4 space-y-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Legend</p>
        {(Object.entries(STATE_CONFIG) as [QuestionState, { label: string; countClass: string }][]).map(
          ([state, config]) => (
            <div key={state} className="flex items-center justify-between text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <div
                  className="qpalette__tile w-4 h-4 rounded text-white flex items-center justify-center text-[10px]"
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

