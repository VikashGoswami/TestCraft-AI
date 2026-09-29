<?php

namespace App\Policies;

use App\Models\Institution;
use App\Models\User;

class InstitutionPolicy
{
    public function view(User $user, Institution $institution): bool
    {
        return $user->institution_id === $institution->id;
    }

    public function manage(User $user, Institution $institution): bool
    {
        return $user->hasRole('institution_admin')
            && $user->institution_id === $institution->id;
    }

    public function manageTeachers(User $user, Institution $institution): bool
    {
        return $this->manage($user, $institution);
    }
}

