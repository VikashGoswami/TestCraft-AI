<?php

namespace App\Policies;

use App\Models\Test;
use App\Models\User;

class TestPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Test $test): bool
    {
        return $test->creator_id === $user->id
            || ($test->institution_id && $test->institution_id === $user->institution_id);
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['individual', 'institution_admin', 'teacher']);
    }

    public function update(User $user, Test $test): bool
    {
        return $test->creator_id === $user->id
            || ($user->hasRole('institution_admin') && $test->institution_id === $user->institution_id);
    }

    public function delete(User $user, Test $test): bool
    {
        return $this->update($user, $test);
    }

    public function share(User $user, Test $test): bool
    {
        return $test->creator_id === $user->id
            || ($user->hasRole('teacher') && $test->institution_id === $user->institution_id);
    }

    public function viewResults(User $user, Test $test): bool
    {
        return $test->creator_id === $user->id
            || ($user->hasAnyRole(['institution_admin', 'teacher'])
                && $test->institution_id === $user->institution_id);
    }
}

