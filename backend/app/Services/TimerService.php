<?php

namespace App\Services;

use App\Enums\AttemptStatus;
use App\Models\Attempt;
use Carbon\Carbon;

class TimerService
{
    /**
     * Get the number of seconds remaining before this attempt expires.
     * Returns 0 if already past the deadline.
     */
    public function getRemainingSeconds(Attempt $attempt): int
    {
        return max(0, (int) now()->diffInSeconds($attempt->expires_at, false));
    }

    /**
     * Determine whether an in-progress attempt has exceeded its deadline.
     */
    public function isExpired(Attempt $attempt): bool
    {
        return $attempt->status === AttemptStatus::InProgress
            && $attempt->expires_at->isPast();
    }

    /**
     * Compute the absolute expiry timestamp for an attempt starting now.
     */
    public function computeExpiresAt(int $durationMinutes): Carbon
    {
        return now()->addMinutes($durationMinutes);
    }
}

