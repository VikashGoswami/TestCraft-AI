<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\BulkUploadQuestionsRequest;
use App\Http\Requests\StoreQuestionRequest;
use App\Models\Option;
use App\Models\Question;
use App\Models\Test;
use App\Services\QuestionImportService;
use Illuminate\Support\Facades\DB;

class QuestionController extends Controller
{
    public function store(StoreQuestionRequest $request, Test $test)
    {
        $this->authorize('update', $test);

        $question = DB::transaction(function () use ($request, $test) {
            $maxOrder = (int) ($test->questions()->max('order_index') ?? 0);

            $question = Question::create([
                'test_id' => $test->id,
                'question_text' => $request->question_text,
                'topic' => $request->topic ?? 'General',
                'difficulty' => $request->difficulty,
                'order_index' => $maxOrder + 1,
                'marks' => $request->marks ?? 1.00,
            ]);

            foreach ($request->options as $optionData) {
                Option::create([
                    'question_id' => $question->id,
                    'option_text' => $optionData['option_text'],
                    'is_correct' => $optionData['is_correct'],
                ]);
            }

            return $question->load('options');
        });

        return response()->json($question, 201);
    }

    public function update(StoreQuestionRequest $request, Test $test, Question $question)
    {
        $this->authorize('update', $test);

        DB::transaction(function () use ($request, $question) {
            $question->update([
                'question_text' => $request->question_text,
                'topic' => $request->topic ?? $question->topic,
                'difficulty' => $request->difficulty,
                'marks' => $request->marks ?? $question->marks,
            ]);

            // Replace all options atomically.
            $question->options()->delete();

            foreach ($request->options as $optionData) {
                Option::create([
                    'question_id' => $question->id,
                    'option_text' => $optionData['option_text'],
                    'is_correct' => $optionData['is_correct'],
                ]);
            }
        });

        return response()->json($question->fresh('options'));
    }

    public function destroy(Test $test, Question $question)
    {
        $this->authorize('update', $test);

        $question->delete();

        return response()->json(['message' => 'Question deleted.']);
    }

    public function bulkUpload(BulkUploadQuestionsRequest $request, Test $test, QuestionImportService $importService)
    {
        $this->authorize('update', $test);

        $result = $importService->import($test, $request->file('file'));

        return response()->json($result);
    }

    /**
     * Generate or fetch detailed explanation and remember short trick for a question.
     */
    public function aiExplanation(Question $question)
    {
        // If already cached in DB, return immediately
        if (!empty($question->explanation) && !empty($question->short_trick)) {
            return response()->json([
                'explanation' => $question->explanation,
                'short_trick' => $question->short_trick,
            ]);
        }

        $options = $question->options;
        $correct = $options->firstWhere('is_correct', true);

        $optionsText = $options->map(fn($o, $i) => chr(65 + $i) . ') ' . $o->option_text)->implode(', ');
        $correctText = $correct ? $correct->option_text : 'Not specified';

        $geminiKey = config('services.gemini.key');
        $models = ['gemini-3.5-flash-lite', 'gemini-3.5-flash'];

        $explanation = null;
        $shortTrick = null;

        if (!empty($geminiKey)) {
            $prompt = <<<PROMPT
You are an expert exam tutor. Provide a clear solution and a memorable short trick for this MCQ question:
Question: {$question->question_text}
Options: {$optionsText}
Correct Answer: {$correctText}

Respond ONLY with valid JSON:
{
  "explanation": "Clear step-by-step explanation of why this answer is correct in 2-3 sentences.",
  "short_trick": "A 1-2 sentence quick trick, mnemonic, or shortcut to solve or memorize this in exams."
}
PROMPT;

            foreach ($models as $model) {
                try {
                    $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$geminiKey}";
                    $res = \Illuminate\Support\Facades\Http::timeout(10)->post($url, [
                        'contents' => [['parts' => [['text' => $prompt]]]],
                        'generationConfig' => ['responseMimeType' => 'application/json'],
                    ]);

                    if ($res->ok()) {
                        $text = $res->json('candidates.0.content.parts.0.text', '');
                        $clean = trim(preg_replace('/^```(?:json)?\s*|\s*```$/i', '', trim($text)));
                        $json = json_decode($clean, true);
                        if (is_array($json) && !empty($json['explanation'])) {
                            $explanation = $json['explanation'];
                            $shortTrick = $json['short_trick'] ?? null;
                            break;
                        }
                    }
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::warning("AI explanation generation on {$model} failed: " . $e->getMessage());
                }
            }
        }

        // Fallbacks
        $explanation = $explanation ?: "The correct answer is \"{$correctText}\". It directly satisfies the question requirement based on core principles of {$question->topic}.";
        $shortTrick = $shortTrick ?: "Remember the key definition of {$question->topic}: focus on elimination of obviously mismatched options.";

        $question->update([
            'explanation' => $explanation,
            'short_trick' => $shortTrick,
        ]);

        return response()->json([
            'explanation' => $explanation,
            'short_trick' => $shortTrick,
        ]);
    }
}

