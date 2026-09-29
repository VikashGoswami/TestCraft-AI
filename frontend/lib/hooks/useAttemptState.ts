'use client';

import { useState, useCallback, useRef } from 'react';
import type { AttemptAnswer, QuestionState } from '@/lib/types';
import { updateAnswer } from '@/lib/api/attempts';

interface UseAttemptStateOptions {
  attemptId: number;
  initialAnswers: AttemptAnswer[];
}

export function useAttemptState({ attemptId, initialAnswers }: UseAttemptStateOptions) {
  const [answers, setAnswers] = useState<Map<number, AttemptAnswer>>(
    () => new Map(initialAnswers.map((a) => [a.question_id, a])),
  );
  const [currentQuestionId, setCurrentQuestionId] = useState<number>(
    initialAnswers[0]?.question_id ?? 0,
  );

  const counts = useCallback(() => {
    let notVisited = 0, notAnswered = 0, answered = 0, marked = 0, answeredMarked = 0;
    answers.forEach((a) => {
      switch (a.state) {
        case 'not_visited': notVisited++; break;
        case 'not_answered': notAnswered++; break;
        case 'answered': answered++; break;
        case 'marked': marked++; break;
        case 'answered_marked': answeredMarked++; break;
      }
    });
    return { notVisited, notAnswered, answered, marked, answeredMarked };
  }, [answers]);

  const dispatch = useCallback(
    async (
      questionId: number,
      action: 'visit' | 'save' | 'mark' | 'clear',
      selectedOptionId: number | null = null,
    ) => {
      try {
        const result = await updateAnswer(attemptId, {
          question_id: questionId,
          selected_option_id: selectedOptionId,
          action,
        });
        setAnswers((prev) => {
          const next = new Map(prev);
          const existing = next.get(questionId);
          if (existing) {
            next.set(questionId, {
              ...existing,
              state: result.state,
              selected_option_id: result.selected_option_id,
            });
          }
          return next;
        });
        return result;
      } catch (error) {
        console.error('Failed to update answer state', error);
        throw error;
      }
    },
    [attemptId],
  );

  const navigateTo = useCallback(
    async (questionId: number) => {
      const current = answers.get(questionId);
      if (current?.state === 'not_visited') {
        await dispatch(questionId, 'visit');
      }
      setCurrentQuestionId(questionId);
    },
    [answers, dispatch],
  );

  const currentAnswer = answers.get(currentQuestionId) ?? null;

  return {
    answers,
    currentQuestionId,
    currentAnswer,
    counts,
    dispatch,
    navigateTo,
    setCurrentQuestionId,
  };
}

