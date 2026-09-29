<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\UploadedFile;

class GeminiExtractionService
{
    private string $apiKey;
    private string $model;
    private string $baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

    public function __construct()
    {
        $this->apiKey = config('services.gemini.key', '');
        $this->model  = config('services.gemini.model', 'gemini-1.5-flash');
    }

    /**
     * Extract MCQ questions from any uploaded file.
     * Returns an array of structured question objects.
     */
    public function extractQuestions(UploadedFile $file, string $contextHint = ''): array
    {
        $ext = strtolower($file->getClientOriginalExtension());

        // Build the Gemini request parts
        $parts = [];

        // Always add the instruction text part first
        $parts[] = [
            'text' => $this->buildPrompt($contextHint),
        ];

        // Add file part depending on type
        if (in_array($ext, ['pdf'])) {
            $parts[] = $this->buildBase64Part($file, 'application/pdf');
        } elseif (in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'])) {
            $mimeMap = [
                'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg',
                'png' => 'image/png', 'webp' => 'image/webp',
                'gif' => 'image/gif', 'bmp' => 'image/bmp',
            ];
            $parts[] = $this->buildBase64Part($file, $mimeMap[$ext] ?? 'image/jpeg');
        } elseif (in_array($ext, ['docx', 'doc'])) {
            // Extract raw text from DOCX, then send as text
            $text = $this->extractDocxText($file);
            $parts[] = ['text' => "Document content:\n\n" . $text];
        } elseif ($ext === 'txt') {
            $text = file_get_contents($file->getRealPath());
            $parts[] = ['text' => "Document content:\n\n" . $text];
        } else {
            throw new \InvalidArgumentException(
                "Unsupported file type: .{$ext}. Supported: PDF, JPG, PNG, DOCX, TXT"
            );
        }

        return $this->callGemini($parts);
    }

    // ─── Private Helpers ─────────────────────────────────────────────────────

    private function buildPrompt(string $contextHint = ''): string
    {
        $hint = $contextHint ? "\n\nContext about this paper: {$contextHint}" : '';

        return <<<PROMPT
You are an expert at extracting Multiple Choice Questions (MCQ) from question papers and documents.

Your task is to extract ALL MCQ questions from the provided document and return them as a valid JSON array.{$hint}

RULES:
1. Extract EVERY question that has multiple choice options (A, B, C, D or 1, 2, 3, 4 or similar).
2. Identify the CORRECT answer for each question. Look for answer keys, markings (*, bold, underline), or context clues.
3. If the correct answer is not clearly marked, use your knowledge to determine the most likely correct answer.
4. Clean up question text - remove question numbers (e.g. "1.", "Q1.", "Q.1") from the start.
5. Normalize options to exactly 4 options (option_a, option_b, option_c, option_d). If a question has only 2 or 3 options, leave extra option fields empty "".
6. For correct_option, use ONLY the single letter: "a", "b", "c", or "d" (lowercase).
7. Guess the topic from context (e.g. "Mathematics", "Physics", "History", "General").
8. For difficulty, use "easy", "medium", or "hard" based on complexity.
9. For marks, default to 1 if not specified, or extract from the paper if marks are shown per question.
10. For reading comprehension passages, statements, or figures/charts that questions refer to, include the relevant passage/statement context in the question_text so each question is complete and self-contained.
11. Handle tables, numbered lists, lettered options, and multi-page question papers thoroughly without skipping questions.

RETURN FORMAT (valid JSON array only, no markdown, no explanation, no extra text):
[
  {
    "question_text": "Full question text here",
    "option_a": "First option text",
    "option_b": "Second option text",
    "option_c": "Third option text",
    "option_d": "Fourth option text",
    "correct_option": "a",
    "topic": "Subject/Topic Name",
    "difficulty": "medium",
    "marks": 1
  }
]

If you cannot find any MCQ questions, return an empty array: []
PROMPT;
    }

    private function buildBase64Part(UploadedFile $file, string $mimeType): array
    {
        $bytes = file_get_contents($file->getRealPath());
        return [
            'inline_data' => [
                'mime_type' => $mimeType,
                'data'      => base64_encode($bytes),
            ],
        ];
    }

    private function extractDocxText(UploadedFile $file): string
    {
        // Use PhpWord if available, otherwise fall back to ZIP/XML extraction
        if (class_exists('\PhpOffice\PhpWord\IOFactory')) {
            try {
                $phpWord = \PhpOffice\PhpWord\IOFactory::load($file->getRealPath());
                $text = '';
                foreach ($phpWord->getSections() as $section) {
                    foreach ($section->getElements() as $element) {
                        if (method_exists($element, 'getText')) {
                            $text .= $element->getText() . "\n";
                        } elseif ($element instanceof \PhpOffice\PhpWord\Element\Table) {
                            foreach ($element->getRows() as $row) {
                                foreach ($row->getCells() as $cell) {
                                    foreach ($cell->getElements() as $cellElement) {
                                        if (method_exists($cellElement, 'getText')) {
                                            $text .= $cellElement->getText() . "\t";
                                        }
                                    }
                                }
                                $text .= "\n";
                            }
                        }
                    }
                }
                return $text;
            } catch (\Throwable $e) {
                Log::warning('PhpWord extraction failed, trying ZIP fallback', ['err' => $e->getMessage()]);
            }
        }

        // Fallback: read raw XML from .docx (which is a ZIP)
        try {
            $zip = new \ZipArchive();
            if ($zip->open($file->getRealPath()) === true) {
                $xml  = $zip->getFromName('word/document.xml');
                $zip->close();
                if ($xml) {
                    // Strip XML tags and decode entities
                    $text = strip_tags(str_replace(['</w:p>', '</w:tr>'], ["\n", "\n"], $xml));
                    return html_entity_decode($text, ENT_QUOTES | ENT_XML1, 'UTF-8');
                }
            }
        } catch (\Throwable $e) {
            Log::warning('ZIP/XML DOCX extraction failed', ['err' => $e->getMessage()]);
        }

        return '(Could not extract text from DOCX file)';
    }

    private function callGemini(array $parts): array
    {
        if (empty($this->apiKey)) {
            throw new \RuntimeException('GEMINI_API_KEY is not configured in .env');
        }

        // Try primary model first, fallback to alternatives on 503 (high demand), 429, or 404
        $modelsToTry = array_unique(array_filter([
            $this->model,
            'gemini-3.5-flash',
            'gemini-3.8-flash',
            'gemini-3.5-flash-lite',
        ]));

        $lastException = null;

        foreach ($modelsToTry as $model) {
            $url = "{$this->baseUrl}/{$model}:generateContent?key={$this->apiKey}";

            try {
                $response = Http::timeout(180)
                    ->connectTimeout(20)
                    ->withHeaders(['Content-Type' => 'application/json'])
                    ->post($url, [
                        'contents' => [
                            ['parts' => $parts],
                        ],
                        'generationConfig' => [
                            'temperature'      => 0.1,  // Low temp = deterministic, structured output
                            'maxOutputTokens'  => 32768, // Max output for large papers
                            'responseMimeType' => 'application/json', // Ask for JSON directly
                        ],
                    ]);

                if ($response->ok()) {
                    $text = $response->json('candidates.0.content.parts.0.text', '');
                    if (empty($text)) {
                        Log::warning("Gemini model {$model} returned empty content", ['response' => $response->json()]);
                        continue;
                    }
                    return $this->parseJson($text);
                }

                $status = $response->status();
                $errorMsg = $response->json('error.message', 'Unknown error');
                Log::warning("Gemini API {$model} failed ({$status}): {$errorMsg}");

                // If temporary error or missing model, try fallback model
                if (in_array($status, [503, 429, 404])) {
                    $lastException = new \RuntimeException("Gemini error ({$status}): {$errorMsg}");
                    continue;
                }

                throw new \RuntimeException("Gemini API error {$status}: {$errorMsg}");
            } catch (\Throwable $e) {
                if ($e instanceof \RuntimeException && isset($status) && !in_array($status, [503, 429, 404])) {
                    throw $e;
                }
                $lastException = $e;
                Log::warning("Gemini request exception on {$model}: " . $e->getMessage());
            }
        }

        throw $lastException ?? new \RuntimeException('Gemini API failed across all attempted models.');
    }

    private function parseJson(string $text): array
    {
        // Gemini may wrap in markdown code block even when responseMimeType is set
        $text = trim($text);
        $text = preg_replace('/^```(?:json)?\s*/i', '', $text);
        $text = preg_replace('/\s*```$/', '', $text);
        $text = trim($text);

        $data = json_decode($text, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            Log::error('Gemini JSON parse failed', [
                'error' => json_last_error_msg(),
                'raw'   => substr($text, 0, 500),
            ]);
            throw new \RuntimeException('AI returned invalid JSON. Please try again.');
        }

        // If wrapped in an object like {"questions": [...]} or {"mcqs": [...]}
        if (is_array($data) && !array_is_list($data)) {
            foreach (['questions', 'mcqs', 'items', 'data'] as $key) {
                if (isset($data[$key]) && is_array($data[$key])) {
                    $data = $data[$key];
                    break;
                }
            }
            // If it's a single question object
            if (!array_is_list($data) && (isset($data['question_text']) || isset($data['question']))) {
                $data = [$data];
            }
        }

        if (!is_array($data)) {
            return [];
        }

        // Validate and normalise each question
        return array_values(array_filter(array_map(function ($q) {
            if (!is_array($q)) return null;

            $questionText = trim($q['question_text'] ?? $q['question'] ?? $q['title'] ?? '');
            if (empty($questionText)) return null;

            // Handle options
            $optA = trim($q['option_a'] ?? '');
            $optB = trim($q['option_b'] ?? '');
            $optC = trim($q['option_c'] ?? '');
            $optD = trim($q['option_d'] ?? '');

            if (isset($q['options']) && is_array($q['options'])) {
                if (array_is_list($q['options'])) {
                    $optA = $optA ?: trim($q['options'][0] ?? '');
                    $optB = $optB ?: trim($q['options'][1] ?? '');
                    $optC = $optC ?: trim($q['options'][2] ?? '');
                    $optD = $optD ?: trim($q['options'][3] ?? '');
                } else {
                    $optA = $optA ?: trim($q['options']['A'] ?? $q['options']['a'] ?? $q['options']['1'] ?? '');
                    $optB = $optB ?: trim($q['options']['B'] ?? $q['options']['b'] ?? $q['options']['2'] ?? '');
                    $optC = $optC ?: trim($q['options']['C'] ?? $q['options']['c'] ?? $q['options']['3'] ?? '');
                    $optD = $optD ?: trim($q['options']['D'] ?? $q['options']['d'] ?? $q['options']['4'] ?? '');
                }
            }

            // Handle correct option
            $rawCorrect = strtolower(trim((string) ($q['correct_option'] ?? $q['answer'] ?? $q['correct_answer'] ?? 'a')));
            if (str_starts_with($rawCorrect, 'option_')) {
                $rawCorrect = substr($rawCorrect, -1);
            }
            if (in_array($rawCorrect, ['1', 'first'])) $rawCorrect = 'a';
            elseif (in_array($rawCorrect, ['2', 'second'])) $rawCorrect = 'b';
            elseif (in_array($rawCorrect, ['3', 'third'])) $rawCorrect = 'c';
            elseif (in_array($rawCorrect, ['4', 'fourth'])) $rawCorrect = 'd';

            if (!in_array($rawCorrect, ['a', 'b', 'c', 'd'])) {
                if ($rawCorrect === strtolower($optA)) $rawCorrect = 'a';
                elseif ($rawCorrect === strtolower($optB)) $rawCorrect = 'b';
                elseif ($rawCorrect === strtolower($optC)) $rawCorrect = 'c';
                elseif ($rawCorrect === strtolower($optD)) $rawCorrect = 'd';
                else $rawCorrect = 'a';
            }

            $diff = strtolower(trim($q['difficulty'] ?? 'medium'));
            if (!in_array($diff, ['easy', 'medium', 'hard'])) {
                $diff = 'medium';
            }

            $marks = is_numeric($q['marks'] ?? null) ? (float) $q['marks'] : 1.0;

            return [
                'question_text'  => $questionText,
                'option_a'       => $optA,
                'option_b'       => $optB,
                'option_c'       => $optC,
                'option_d'       => $optD,
                'correct_option' => $rawCorrect,
                'topic'          => trim($q['topic'] ?? 'General'),
                'difficulty'     => $diff,
                'marks'          => $marks,
            ];
        }, $data)));
    }
}
