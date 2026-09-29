<?php

namespace App\Jobs;

use App\Enums\GenerationStatus;
use App\Models\Attempt;
use App\Models\AttemptReport;
use App\Services\AiReportService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class GenerateAttemptReportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /** @var int Maximum seconds this job may run before the queue worker kills it. */
    public int $timeout = 30;

    /** @var int Only one attempt — fallback handles errors gracefully. */
    public int $tries = 1;

    public function __construct(public readonly Attempt $attempt) {}

    public function handle(AiReportService $aiService): void
    {
        $report = AttemptReport::firstOrCreate(
            ['attempt_id' => $this->attempt->id],
            ['generation_status' => GenerationStatus::Pending]
        );

        // Idempotent: don't regenerate a completed report.
        if ($report->generation_status === GenerationStatus::Completed) {
            return;
        }

        // Per-institution daily cap: 100 AI report calls per calendar day.
        if (!$this->withinDailyLimit()) {
            $this->saveFallback($report, 'Daily AI report limit reached. Showing statistical analysis.');
            return;
        }

        $test = $this->attempt->test;
        $scoreData = [
            'topics' => $this->buildTopicStats(),
            'overall_percentage' => (int) $this->attempt->score,
        ];

        try {
            $result = $aiService->generateReport($test->title, $scoreData);

            $report->update([
                'strong_topics' => $result['strong_topics'],
                'weak_topics' => $result['weak_topics'],
                'ai_summary' => $result['summary'],
                'topic_advice' => $result['topic_advice'],
                'generation_status' => GenerationStatus::Completed,
            ]);
        } catch (\Throwable $e) {
            Log::error('GenerateAttemptReportJob failed', [
                'attempt_id' => $this->attempt->id,
                'error' => $e->getMessage(),
            ]);

            // AiReportService already tries its own fallback; we still produce a report.
            $fallback = $aiService->generateReport($test->title, $scoreData);

            $report->update([
                'strong_topics' => $fallback['strong_topics'],
                'weak_topics' => $fallback['weak_topics'],
                'ai_summary' => $fallback['summary'],
                'topic_advice' => $fallback['topic_advice'],
                'generation_status' => GenerationStatus::FailedFallback,
            ]);
        }
    }

    /**
     * Build per-topic correct/total stats from the attempt's answers.
     *
     * @return array<int, array{topic: string, correct: int, total: int, percentage: int}>
     */
    private function buildTopicStats(): array
    {
        return $this->attempt->answers()
            ->with(['question', 'selectedOption'])
            ->get()
            ->groupBy(fn($a) => $a->question->topic ?? 'General')
            ->map(function ($answers, $topic) {
                $total = $answers->count();
                $correct = $answers->filter(fn($a) => $a->selectedOption?->is_correct)->count();

                return [
                    'topic' => $topic,
                    'correct' => $correct,
                    'total' => $total,
                    'percentage' => $total > 0 ? (int) round($correct / $total * 100) : 0,
                ];
            })
            ->values()
            ->toArray();
    }

    /**
     * Enforce a 100 AI-call daily cap per institution (or per individual creator).
     * Uses atomic cache increments so this is safe across multiple workers.
     */
    private function withinDailyLimit(): bool
    {
        $scopeKey = $this->attempt->test->institution_id
            ? 'inst_' . $this->attempt->test->institution_id
            : 'user_' . $this->attempt->test->creator_id;

        $cacheKey = 'ai_report_calls_' . date('Y-m-d') . '_' . $scopeKey;

        $count = Cache::increment($cacheKey);

        // Ensure TTL is set on the first increment.
        if ($count === 1) {
            Cache::put($cacheKey, 1, now()->endOfDay());
        }

        return $count <= 100;
    }

    /**
     * Persist a fallback-status report row when AI is unavailable or capped.
     */
    private function saveFallback(AttemptReport $report, string $summary): void
    {
        $report->update([
            'ai_summary' => $summary,
            'strong_topics' => [],
            'weak_topics' => [],
            'topic_advice' => [],
            'generation_status' => GenerationStatus::FailedFallback,
        ]);
    }
}

