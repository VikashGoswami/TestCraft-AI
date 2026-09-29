<?php

namespace App\Policies;

use App\Models\Attempt;
use App\Models\User;

class AttemptPolicy
{
    /**
     * Allows nullable $user so guest-aware logic can call this without crashing.
     * Guest sessions are validated separately in EnsureAttemptOwnership middleware.
     */
    public function view(?User $user, Attempt $attempt): bool
    {
        if ($user) {
            return $attempt->user_id === $user->id
                || $attempt->test->creator_id === $user->id
                || ($user->hasAnyRole(['institution_admin', 'teacher'])
                    && $attempt->test->institution_id === $user->institution_id);
        }

        return false;
    }

    public function update(?User $user, Attempt $attempt): bool
    {
        return $user !== null && $attempt->user_id === $user->id;
    }
}

