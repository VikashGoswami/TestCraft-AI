<?php

namespace App\Services;

use App\Models\Attempt;

class ScoringService
{
    /**
     * Score a submitted attempt.
     *
     * Supports per-question marks and negative marking rules on the test.
     * Formula:
     *   earned = Σ(correct_answers × question.marks)
     *          - Σ(wrong_answers × question.marks × test.negative_mark)
     *   score% = earned / total_possible × 100  (clamped to 0)
     *
     * @return array{topics: array, overall_percentage: int, total_correct: int, total_questions: int, total_wrong: int, total_earned: float, total_possible: float}
     */
    public function score(Attempt $attempt): array
    {
        $test = $attempt->test;
        $hasNegativeMarking = (bool) ($test->has_negative_marking ?? false);
        $negativeMark = (float) ($test->negative_mark ?? 0.25);

        $answers = $attempt->answers()
            ->with(['question', 'selectedOption'])
            ->get();

        $topicStats   = [];
        $totalCorrect = 0;
        $totalWrong   = 0;
        $totalEarned  = 0.0;
        $totalPossible = 0.0;
        $totalQuestions = $answers->count();

        foreach ($answers as $answer) {
            $topic     = $answer->question->topic ?? 'General';
            $qMarks    = (float) ($answer->question->marks ?? 1.00);
            $answered  = $answer->selected_option_id !== null;
            $isCorrect = $answered && ($answer->selectedOption?->is_correct ?? false);
            $isWrong   = $answered && !$isCorrect;

            if (!isset($topicStats[$topic])) {
                $topicStats[$topic] = [
                    'topic'    => $topic,
                    'correct'  => 0,
                    'wrong'    => 0,
                    'total'    => 0,
                    'earned'   => 0.0,
                    'possible' => 0.0,
                ];
            }

            $topicStats[$topic]['total']++;
            $totalPossible += $qMarks;
            $topicStats[$topic]['possible'] += $qMarks;

            if ($isCorrect) {
                $topicStats[$topic]['correct']++;
                $topicStats[$topic]['earned'] += $qMarks;
                $totalCorrect++;
                $totalEarned += $qMarks;
            } elseif ($isWrong && $hasNegativeMarking) {
                $deduction = $qMarks * $negativeMark;
                $topicStats[$topic]['wrong']++;
                $topicStats[$topic]['earned'] -= $deduction;
                $totalWrong++;
                $totalEarned -= $deduction;
            } elseif ($isWrong) {
                $topicStats[$topic]['wrong']++;
                $totalWrong++;
            }
        }

        // Compute per-topic percentage
        foreach ($topicStats as &$stat) {
            $stat['percentage'] = $stat['possible'] > 0
                ? (int) round(max(0, $stat['earned']) / $stat['possible'] * 100)
                : 0;
        }
        unset($stat);

        // Overall percentage: clamp to [0, 100]
        $overallPercentage = $totalPossible > 0
            ? (int) round(max(0.0, min($totalEarned, $totalPossible)) / $totalPossible * 100)
            : 0;

        $attempt->update(['score' => $overallPercentage]);

        return [
            'topics'             => array_values($topicStats),
            'overall_percentage' => $overallPercentage,
            'total_correct'      => $totalCorrect,
            'total_wrong'        => $totalWrong,
            'total_questions'    => $totalQuestions,
            'total_earned'       => round($totalEarned, 2),
            'total_possible'     => round($totalPossible, 2),
        ];
    }
}
