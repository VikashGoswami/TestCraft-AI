<?php

namespace App\Jobs;

use App\Enums\AttemptStatus;
use App\Events\AttemptSubmitted;
use App\Models\Attempt;
use App\Services\ScoringService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class AutoSubmitExpiredAttemptsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(ScoringService $scoringService): void
    {
        Attempt::where('status', AttemptStatus::InProgress)
            ->where('expires_at', '<', now())
            ->chunkById(100, function ($attempts) use ($scoringService) {
                foreach ($attempts as $attempt) {
                    $attempt->update([
                        'status' => AttemptStatus::Submitted,
                        'submitted_at' => $attempt->expires_at,
                    ]);

                    $scoringService->score($attempt);

                    if ($attempt->share_id) {
                        $attempt->share->increment('completion_count');
                    }

                    event(new AttemptSubmitted($attempt->fresh()));
                }
            });
    }
}

