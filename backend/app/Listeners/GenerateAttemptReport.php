<?php

namespace App\Listeners;

use App\Events\AttemptSubmitted;
use App\Jobs\GenerateAttemptReportJob;

class GenerateAttemptReport
{
    /**
     * Dispatch the async report generation job when an attempt is submitted.
     * The job handles AI call, schema validation, fallback, and daily cap.
     */
    public function handle(AttemptSubmitted $event): void
    {
        GenerateAttemptReportJob::dispatch($event->attempt);
    }
}

