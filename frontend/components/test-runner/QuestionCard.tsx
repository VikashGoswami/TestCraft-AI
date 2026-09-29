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
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          Question {questionNumber} of {totalQuestions}
        </span>
        <div className="flex items-center gap-2">
          {question.difficulty && (
            <span className={`badge capitalize ${
              question.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
              question.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' :
              'bg-red-100 text-red-700'
            }`}>
              {question.difficulty}
            </span>
          )}
          <span className="badge bg-blue-100 text-blue-700">{question.topic}</span>
        </div>
      </div>

      <div className="text-gray-900 text-lg leading-relaxed font-medium">
        {question.question_text}
      </div>

      <div className="space-y-3">
        {question.options.map((option, idx) => {
          const isSelected = selectedOptionId === option.id;
          return (
            <button
              key={option.id}
              onClick={() => onSelect(option.id)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3 ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/50 text-blue-900 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50 text-gray-800'
              }`}
            >
              <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {letters[idx] ?? idx + 1}
              </span>
              <span className="text-base leading-normal">{option.option_text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

