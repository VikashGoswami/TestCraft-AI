<?php

namespace App\Enums;

enum UserRole: string
{
    case Individual = 'individual';
    case InstitutionAdmin = 'institution_admin';
    case Teacher = 'teacher';
    case Student = 'student';
}

