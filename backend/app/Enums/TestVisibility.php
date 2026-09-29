<?php

namespace App\Enums;

enum TestVisibility: string
{
    case Public = 'public';
    case Private = 'private';
    case InviteOnly = 'invite_only';
}

