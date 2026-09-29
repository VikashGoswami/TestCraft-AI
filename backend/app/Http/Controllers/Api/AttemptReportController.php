<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Enums\GenerationStatus;
use App\Models\Attempt;
use App\Models\AttemptReport;
use App\Services\AiReportService;
use App\Services\ScoringService;
use Illuminate\Http\JsonResponse;

class AttemptReportController extends Controller
{
    public function __construct(
        private readonly ScoringService $scoringService,
        private readonly AiReportService $aiReportService,
    ) {}

    /**
     * Return the detailed assessment report for a submitted attempt.
     * Computes on-the-fly statistics:
     * - total_questions
     * - attempted_questions
     * - unattempted_questions
     * - correct_questions
     * - wrong_questions
     * - total_earned_marks & total_possible_marks
     * - negative marking rules
     * - AI Suggestions (strong_topics, weak_topics, ai_summary, topic_advice)
     */
    public function show(Attempt $attempt): JsonResponse
    {
        $test = $attempt->test;

        // Compute authoritative scoring stats
        $stats = $this->scoringService->score($attempt);

        $answers = $attempt->answers;
        $totalQuestions = $stats['total_questions'] ?: $test->questions()->count();
        $totalAttempted = $answers->whereNotNull('selected_option_id')->count();
        $totalUnattempted = max(0, $totalQuestions - $totalAttempted);
        $totalCorrect = $stats['total_correct'];
        $totalWrong = $stats['total_wrong'];
        $totalEarned = round($stats['total_earned'], 2);
        $totalPossible = round($stats['total_possible'], 2);

        // Fetch or immediately generate AI Report synchronously so user never hangs
        $report = AttemptReport::where('attempt_id', $attempt->id)->first();

        if (!$report || $report->generation_status !== GenerationStatus::Completed) {
            try {
                $aiData = $this->aiReportService->generateReport($test->title, [
                    'topics' => $stats['topics'],
                    'overall_percentage' => $stats['overall_percentage'],
                    'total_questions' => $totalQuestions,
                    'total_correct' => $totalCorrect,
                    'total_wrong' => $totalWrong,
                    'total_attempted' => $totalAttempted,
                    'total_unattempted' => $totalUnattempted,
                    'total_earned' => $totalEarned,
                    'total_possible' => $totalPossible,
                ]);

                $report = AttemptReport::updateOrCreate(
                    ['attempt_id' => $attempt->id],
                    [
                        'strong_topics' => $aiData['strong_topics'] ?? [],
                        'weak_topics' => $aiData['weak_topics'] ?? [],
                        'ai_summary' => $aiData['summary'] ?? null,
                        'topic_advice' => $aiData['topic_advice'] ?? [],
                        'generation_status' => GenerationStatus::Completed,
                    ]
                );
            } catch (\Throwable $e) {
                $report = AttemptReport::updateOrCreate(
                    ['attempt_id' => $attempt->id],
                    [
                        'strong_topics' => ['Core Subject Knowledge'],
                        'weak_topics' => ['Incorrect & Unattempted Questions'],
                        'ai_summary' => "You scored {$stats['overall_percentage']}% on {$test->title}, earning {$totalEarned} of {$totalPossible} marks.",
                        'topic_advice' => [],
                        'generation_status' => GenerationStatus::Completed,
                    ]
                );
            }
        }

        return response()->json([
            'attempt_id' => $attempt->id,
            'test_id' => $test->id,
            'test_title' => $test->title,
            'score' => $attempt->score !== null ? (float) $attempt->score : (float) $stats['overall_percentage'],
            'total_questions' => $totalQuestions,
            'attempted_questions' => $totalAttempted,
            'unattempted_questions' => $totalUnattempted,
            'correct_questions' => $totalCorrect,
            'wrong_questions' => $totalWrong,
            'total_earned_marks' => $totalEarned,
            'total_possible_marks' => $totalPossible,
            'has_negative_marking' => (bool) $test->has_negative_marking,
            'negative_mark' => (float) ($test->negative_mark ?? 0.25),
            'topics' => $stats['topics'],
            'strong_topics' => $report->strong_topics ?? [],
            'weak_topics' => $report->weak_topics ?? [],
            'ai_summary' => $report->ai_summary,
            'topic_advice' => $report->topic_advice ?? [],
            'generation_status' => $report->generation_status->value ?? 'completed',
            'created_at' => $report->created_at,
        ]);
    }
}
