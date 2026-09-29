<?php

namespace App\Policies;

use App\Models\SchoolClass;
use App\Models\User;

class ClassPolicy
{
    public function view(User $user, SchoolClass $class): bool
    {
        return $class->teacher_id === $user->id
            || ($user->hasRole('institution_admin') && $class->institution_id === $user->institution_id)
            || $class->students()->where('student_user_id', $user->id)->exists();
    }

    public function manage(User $user, SchoolClass $class): bool
    {
        return $class->teacher_id === $user->id
            || ($user->hasRole('institution_admin') && $class->institution_id === $user->institution_id);
    }
}

