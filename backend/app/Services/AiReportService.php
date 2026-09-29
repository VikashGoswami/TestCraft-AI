<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiReportService
{
    /**
     * Generate a structured AI report for a student's test performance.
     *
     * Uses Gemini API (with fallback to Claude if configured, and deterministic PHP fallback).
     *
     * @param  string  $testTitle
     * @param  array   $scoreData
     * @return array{strong_topics: array, weak_topics: array, summary: string, topic_advice: array}
     */
    public function generateReport(string $testTitle, array $scoreData): array
    {
        $topics = $scoreData['topics'] ?? [];
        $overallPercentage = $scoreData['overall_percentage'] ?? 0;
        $totalQuestions = $scoreData['total_questions'] ?? count($topics);
        $totalCorrect = $scoreData['total_correct'] ?? 0;
        $totalWrong = $scoreData['total_wrong'] ?? 0;
        $totalAttempted = $scoreData['total_attempted'] ?? ($totalCorrect + $totalWrong);
        $totalUnattempted = $scoreData['total_unattempted'] ?? max(0, $totalQuestions - $totalAttempted);
        $totalEarned = $scoreData['total_earned'] ?? $totalCorrect;
        $totalPossible = $scoreData['total_possible'] ?? $totalQuestions;

        $input = [
            'test_title' => $testTitle,
            'overall_percentage' => $overallPercentage,
            'total_questions' => $totalQuestions,
            'total_correct' => $totalCorrect,
            'total_wrong' => $totalWrong,
            'total_attempted' => $totalAttempted,
            'total_unattempted' => $totalUnattempted,
            'total_earned_marks' => $totalEarned,
            'total_possible_marks' => $totalPossible,
            'topics' => $topics,
        ];

        // 1. Try Gemini API first (using available free tier models)
        $geminiKey = config('services.gemini.key');
        if (!empty($geminiKey)) {
            try {
                $result = $this->callGemini($geminiKey, $input);
                if ($this->validateSchema($result)) {
                    return $result;
                }
            } catch (\Throwable $e) {
                Log::warning('AiReportService Gemini call failed: ' . $e->getMessage());
            }
        }

        // 2. Try Anthropic Claude API if configured
        $anthropicKey = config('services.anthropic.key');
        if (!empty($anthropicKey)) {
            try {
                $result = $this->callClaude($input);
                if ($this->validateSchema($result)) {
                    return $result;
                }
            } catch (\Throwable $e) {
                Log::warning('AiReportService Claude call failed: ' . $e->getMessage());
            }
        }

        // 3. Robust deterministic fallback
        return $this->generateFallback($input);
    }

    /**
     * Call Google Gemini API to analyze test performance.
     */
    private function callGemini(string $apiKey, array $input): array
    {
        $prompt = <<<PROMPT
You are an expert pedagogical and educational assessment advisor.
Analyze this student's completed test performance and provide insightful, constructive feedback.

Performance Data:
{$this->formatJson($input)}

Respond ONLY with valid JSON matching this exact schema (no markdown formatting, no code fences):
{
  "strong_topics": ["Specific strong topic or sub-topic name 1", "Specific strong topic 2"],
  "weak_topics": ["Specific weak topic or improvement area 1", "Specific weak topic 2"],
  "summary": "3-4 sentence comprehensive and encouraging performance summary covering accuracy, marks obtained, and pacing.",
  "topic_advice": [
    {
      "topic": "Topic Name",
      "advice": "2-3 sentence targeted study guidance with specific actions to improve."
    }
  ]
}
PROMPT;

        $models = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.8-flash'];

        foreach ($models as $model) {
            try {
                $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";
                $response = Http::timeout(15)
                    ->withHeaders(['Content-Type' => 'application/json'])
                    ->post($url, [
                        'contents' => [
                            ['parts' => [['text' => $prompt]]],
                        ],
                        'generationConfig' => [
                            'temperature' => 0.2,
                            'responseMimeType' => 'application/json',
                        ],
                    ]);

                if ($response->ok()) {
                    $text = $response->json('candidates.0.content.parts.0.text', '');
                    $parsed = $this->cleanAndParseJson($text);
                    if ($this->validateSchema($parsed)) {
                        return $parsed;
                    }
                }
            } catch (\Throwable $e) {
                Log::warning("Gemini model {$model} failed in AiReportService: " . $e->getMessage());
            }
        }

        throw new \RuntimeException('All Gemini models failed for report generation');
    }

    /**
     * Call the Anthropic Claude API.
     */
    private function callClaude(array $input): array
    {
        $prompt = <<<PROMPT
You are an educational assessment advisor. Given this student's test performance data, generate a structured analysis.

Performance data:
{$this->formatJson($input)}

Respond ONLY with valid JSON matching this exact schema (no markdown, no extra text):
{
  "strong_topics": ["string"],
  "weak_topics": ["string"],
  "summary": "2-4 sentence overall narrative",
  "topic_advice": [{"topic": "string", "advice": "2-3 sentence targeted guidance"}]
}
PROMPT;

        $response = Http::timeout(10)
            ->withHeaders([
                'x-api-key' => config('services.anthropic.key'),
                'anthropic-version' => '2023-06-01',
                'content-type' => 'application/json',
            ])
            ->post('https://api.anthropic.com/v1/messages', [
                'model' => config('services.anthropic.model', 'claude-haiku-4-5-20251001'),
                'max_tokens' => 1024,
                'messages' => [
                    ['role' => 'user', 'content' => $prompt],
                ],
            ]);

        if (!$response->ok()) {
            throw new \RuntimeException('Claude API error: ' . $response->body());
        }

        $content = $response->json('content.0.text') ?? '';
        return $this->cleanAndParseJson($content);
    }

    private function cleanAndParseJson(string $text): array
    {
        $text = trim($text);
        $text = preg_replace('/^```(?:json)?\s*/i', '', $text);
        $text = preg_replace('/\s*```$/', '', $text);
        $text = trim($text);

        $data = json_decode($text, true);
        if (!is_array($data)) {
            return [];
        }

        // Normalize topic_advice if string or odd format
        if (isset($data['topic_advice']) && is_string($data['topic_advice'])) {
            $data['topic_advice'] = [
                ['topic' => 'Overall Recommendations', 'advice' => $data['topic_advice']]
            ];
        }

        return $data;
    }

    private function formatJson(array $data): string
    {
        return json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }

    /**
     * Validate that the response matches the expected schema.
     */
    private function validateSchema(array $data): bool
    {
        return isset($data['strong_topics'], $data['weak_topics'], $data['summary'], $data['topic_advice'])
            && is_array($data['strong_topics'])
            && is_array($data['weak_topics'])
            && is_string($data['summary'])
            && !empty($data['summary']);
    }

    /**
     * Deterministic PHP fallback when external AI calls fail or time out.
     */
    private function generateFallback(array $topicsOrInput, int $overallPercentage = 0): array
    {
        if (isset($topicsOrInput['topics'])) {
            $topics = $topicsOrInput['topics'];
            $overallPercentage = $topicsOrInput['overall_percentage'] ?? $overallPercentage;
            $testTitle = $topicsOrInput['test_title'] ?? 'the test';
        } else {
            $topics = $topicsOrInput;
            $testTitle = 'the test';
        }

        $sorted = collect($topics)->sortBy('percentage');
        $weakTopics = $sorted->filter(fn($t) => ($t['percentage'] ?? 0) < 60)->pluck('topic')->values()->toArray();
        $strongTopics = $sorted->filter(fn($t) => ($t['percentage'] ?? 0) >= 80)->pluck('topic')->values()->toArray();

        // If no strong topics found but some correct answers, pick top scoring as relative strength
        if (empty($strongTopics) && !empty($topics) && $overallPercentage >= 60) {
            $best = $sorted->last();
            if ($best && ($best['correct'] ?? 0) > 0) {
                $strongTopics = [$best['topic']];
            }
        }

        // If no weak topics found but errors exist, pick lowest scoring
        if (empty($weakTopics) && !empty($topics) && $sorted->contains(fn($t) => ($t['wrong'] ?? 0) > 0 || ($t['percentage'] ?? 100) < 100)) {
            $weakTopics = [$sorted->first()['topic']];
        }

        $weakest = $sorted->first();
        $summary = "You scored {$overallPercentage}% overall.";

        if ($weakest) {
            $summary .= " Your weakest area was {$weakest['topic']} ({$weakest['percentage']}%).";
        }

        if (!empty($strongTopics)) {
            $summary .= ' You showed strength in ' . implode(', ', $strongTopics) . '.';
        }

        $summary .= ' Review your incorrect answers and focus on the topics listed below.';

        $topicAdvice = array_values(array_map(
            fn($t) => [
                'topic' => $t['topic'],
                'advice' => "You scored {$t['percentage']}% in {$t['topic']}. Review the core concepts in this area and practice more questions. Focus on understanding the underlying principles rather than memorizing answers.",
            ],
            array_filter($topics, fn($t) => ($t['percentage'] ?? 100) < 60)
        ));

        if (empty($topicAdvice) && !empty($weakTopics)) {
            foreach ($weakTopics as $w) {
                $topicAdvice[] = [
                    'topic' => $w,
                    'advice' => "Review incorrect questions and practice timed problem sets to improve accuracy.",
                ];
            }
        }

        return [
            'strong_topics' => $strongTopics,
            'weak_topics' => $weakTopics,
            'summary' => $summary,
            'topic_advice' => $topicAdvice,
        ];
    }
}
