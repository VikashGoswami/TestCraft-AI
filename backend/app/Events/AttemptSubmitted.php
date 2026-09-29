<?php

namespace App\Events;

use App\Models\Attempt;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AttemptSubmitted
{
    use Dispatchable, SerializesModels;

    public function __construct(public readonly Attempt $attempt) {}
}

