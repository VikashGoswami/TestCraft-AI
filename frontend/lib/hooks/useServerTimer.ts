'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseServerTimerOptions {
  expiresAt: string; // ISO string from server
  onExpire?: () => void;
  resyncIntervalMs?: number; // how often to re-anchor against server time (default 30s)
}

export function useServerTimer({
  expiresAt,
  onExpire,
  resyncIntervalMs = 30_000,
}: UseServerTimerOptions) {
  const expiresAtMs = new Date(expiresAt).getTime();

  const computeRemaining = useCallback(() => {
    return Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000));
  }, [expiresAtMs]);

  const [secondsRemaining, setSecondsRemaining] = useState(computeRemaining);
  const expiredFiredRef = useRef(false);

  useEffect(() => {
    expiredFiredRef.current = false;
    setSecondsRemaining(computeRemaining());

    // Tick every second, anchored to server expires_at — NOT a simple countdown
    const interval = setInterval(() => {
      const remaining = computeRemaining();
      setSecondsRemaining(remaining);

      if (remaining === 0 && !expiredFiredRef.current) {
        expiredFiredRef.current = true;
        onExpire?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [computeRemaining, onExpire]);

  const formatted = useCallback(() => {
    const h = Math.floor(secondsRemaining / 3600);
    const m = Math.floor((secondsRemaining % 3600) / 60);
    const s = secondsRemaining % 60;
    const parts = h > 0
      ? [String(h).padStart(2, '0'), String(m).padStart(2, '0'), String(s).padStart(2, '0')]
      : [String(m).padStart(2, '0'), String(s).padStart(2, '0')];
    return parts.join(':');
  }, [secondsRemaining]);

  const isWarning = secondsRemaining <= 300; // last 5 minutes
  const isCritical = secondsRemaining <= 60;  // last 1 minute

  return { secondsRemaining, formatted, isWarning, isCritical };
}

