<?php

namespace App\Enums;

enum GenerationStatus: string
{
    case Pending = 'pending';
    case Completed = 'completed';
    case FailedFallback = 'failed_fallback';
}

