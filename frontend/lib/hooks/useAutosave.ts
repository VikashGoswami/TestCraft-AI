'use client';

import { useCallback, useRef } from 'react';
import { updateAnswer } from '@/lib/api/attempts';

interface UseAutosaveOptions {
  attemptId: number;
  debounceMs?: number;
}

export function useAutosave({ attemptId, debounceMs = 300 }: UseAutosaveOptions) {
  const pendingRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const lastSyncRef = useRef<number>(Date.now());
  const hasUnsyncedRef = useRef(false);

  const save = useCallback(
    (questionId: number, selectedOptionId: number | null) => {
      // Cancel any pending save for this question
      const existingTimer = pendingRef.current.get(questionId);
      if (existingTimer) clearTimeout(existingTimer);

      hasUnsyncedRef.current = true;

      const timer = setTimeout(async () => {
        try {
          await updateAnswer(attemptId, {
            question_id: questionId,
            selected_option_id: selectedOptionId,
            action: 'save',
          });
          lastSyncRef.current = Date.now();
          hasUnsyncedRef.current = false;
        } catch (error) {
          console.error('Autosave failed', error);
        } finally {
          pendingRef.current.delete(questionId);
        }
      }, debounceMs);

      pendingRef.current.set(questionId, timer);
    },
    [attemptId, debounceMs],
  );

  const isStale = useCallback(() => {
    return hasUnsyncedRef.current && Date.now() - lastSyncRef.current > 10_000;
  }, []);

  const flush = useCallback(() => {
    // Cancel all pending timers and fire immediately
    pendingRef.current.forEach((timer) => clearTimeout(timer));
    pendingRef.current.clear();
  }, []);

  return { save, isStale, flush };
}

