<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StartAttemptRequest;
use App\Http\Requests\UpdateAttemptAnswerRequest;
use App\Http\Resources\AttemptResource;
use App\Enums\AttemptStatus;
use App\Enums\QuestionState;
use App\Events\AttemptSubmitted;
use App\Models\Attempt;
use App\Models\AttemptAnswer;
use App\Models\Test;
use App\Models\TestShare;
use App\Services\AttemptStateService;
use App\Services\ScoringService;
use App\Services\ShareTrackingService;
use App\Services\TimerService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AttemptController extends Controller
{
    public function __construct(
        private readonly AttemptStateService $stateService,
        private readonly ScoringService $scoringService,
        private readonly ShareTrackingService $shareTracking,
        private readonly TimerService $timerService,
    ) {}

    /**
     * Start a new attempt for the given test.
     * Works for both authenticated users and named guests.
     */
    public function store(StartAttemptRequest $request, Test $test)
    {
        $share = null;

        if ($request->share_slug) {
            $share = TestShare::where('slug', $request->share_slug)->firstOrFail();

            if ($this->shareTracking->isExpired($share)) {
                return response()->json(['message' => 'This share link has expired.'], 422);
            }

            if (!$this->shareTracking->hasCapacity($share)) {
                return response()->json(['message' => 'This test has reached its participant limit.'], 422);
            }
        }

        $user = $request->authenticatedUser();

        $attempt = DB::transaction(function () use ($request, $test, $share, $user) {
            $attempt = Attempt::create([
                'test_id' => $test->id,
                'share_id' => $share?->id,
                'user_id' => $user?->id,
                'guest_name' => $user ? $user->name : $request->guest_name,
                'guest_email' => $user ? $user->email : $request->guest_email,
                'started_at' => now(),
                'expires_at' => $this->timerService->computeExpiresAt($test->duration_minutes),
                'status' => AttemptStatus::InProgress,
            ]);

            $questions = $test->questions()->ordered()->get();

            if ($test->shuffle_questions) {
                $questions = $questions->shuffle();
            }

            // Pre-seed one answer row per question as not_visited.
            $now = now();
            $answerRows = $questions->map(fn($q) => [
                'attempt_id' => $attempt->id,
                'question_id' => $q->id,
                'selected_option_id' => null,
                'state' => QuestionState::NotVisited->value,
                'created_at' => $now,
                'updated_at' => $now,
            ])->all();

            AttemptAnswer::insert($answerRows);

            return $attempt;
        });

        if ($share) {
            $this->shareTracking->recordStart($share);
        }

        // Persist guest ownership in session for EnsureAttemptOwnership middleware.
        if (!$user && $request->hasSession()) {
            $request->session()->put('guest_attempt_id', $attempt->id);
        }

        return new AttemptResource($attempt->load(['user', 'test.questions.options', 'answers']));
    }

    /**
     * List the authenticated user's own attempts.
     * Supports optional ?status= and ?limit= query params.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Attempt::with(['test'])
            ->where('user_id', $user->id)
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $limit = min((int) ($request->limit ?? 20), 50);
        $attempts = $query->limit($limit)->get();

        return AttemptResource::collection($attempts);
    }

    /**
     * Get attempt details, including questions, options, and current answers.
     */
    public function show(Attempt $attempt)
    {
        return new AttemptResource($attempt->load(['test.questions.options', 'answers']));
    }

    /**
     * Apply a 5-state machine transition to one answer in the attempt.
     */
    public function updateAnswer(UpdateAttemptAnswerRequest $request, Attempt $attempt)
    {
        if ($this->timerService->isExpired($attempt)) {
            $this->forceSubmit($attempt);
            return response()->json(['message' => 'Attempt has expired and been auto-submitted.'], 422);
        }

        $answer = AttemptAnswer::where('attempt_id', $attempt->id)
            ->where('question_id', $request->question_id)
            ->firstOrFail();

        $answer = $this->stateService->transition($answer, $request->action, $request->selected_option_id);

        return response()->json([
            'state' => $answer->state,
            'selected_option_id' => $answer->selected_option_id,
        ]);
    }

    /**
     * Submit the attempt, score it, and dispatch the report generation job.
     */
    public function submit(Request $request, Attempt $attempt)
    {
        if ($attempt->status !== AttemptStatus::InProgress) {
            return response()->json(['message' => 'Attempt already submitted.'], 422);
        }

        DB::transaction(function () use ($attempt) {
            $attempt->update([
                'status' => AttemptStatus::Submitted,
                'submitted_at' => now(),
            ]);

            $this->scoringService->score($attempt);

            if ($attempt->share_id) {
                $this->shareTracking->recordCompletion($attempt->share);
            }
        });

        event(new AttemptSubmitted($attempt->fresh()));

        return new AttemptResource($attempt->fresh(['test', 'answers']));
    }

    /**
     * Force-submit an expired attempt — called when updateAnswer detects expiry.
     */
    private function forceSubmit(Attempt $attempt): void
    {
        if ($attempt->status === AttemptStatus::InProgress) {
            $attempt->update([
                'status' => AttemptStatus::Submitted,
                'submitted_at' => $attempt->expires_at,
            ]);

            $this->scoringService->score($attempt);
            event(new AttemptSubmitted($attempt->fresh()));
        }
    }

    /**
     * Return complete question-by-question review of a submitted attempt.
     */
    public function review(Attempt $attempt)
    {
        $test = $attempt->test;
        $stats = $this->scoringService->score($attempt);

        $answers = $attempt->answers->keyBy('question_id');
        $questions = $test->questions()->ordered()->with('options')->get();

        $negativeMark = (float) ($test->negative_mark ?? 0.25);
        $hasNegative = (bool) $test->has_negative_marking;

        $reviewQuestions = $questions->map(function ($q, $index) use ($answers, $hasNegative, $negativeMark) {
            $ans = $answers->get($q->id);
            $selectedOptionId = $ans?->selected_option_id;

            $correctOption = $q->options->firstWhere('is_correct', true);
            $selectedOption = $selectedOptionId ? $q->options->firstWhere('id', $selectedOptionId) : null;

            $status = 'unattempted';
            $marksAwarded = 0.0;

            if ($selectedOptionId !== null) {
                if ($selectedOption && $selectedOption->is_correct) {
                    $status = 'correct';
                    $marksAwarded = (float) $q->marks;
                } else {
                    $status = 'wrong';
                    $marksAwarded = $hasNegative ? -round((float)$q->marks * $negativeMark, 2) : 0.0;
                }
            }

            $letters = ['A', 'B', 'C', 'D', 'E', 'F'];
            $optionsList = $q->options->values()->map(function ($opt, $optIdx) use ($letters, $selectedOptionId) {
                return [
                    'id' => $opt->id,
                    'letter' => $letters[$optIdx] ?? chr(65 + $optIdx),
                    'option_text' => $opt->option_text,
                    'is_correct' => (bool) $opt->is_correct,
                    'is_selected' => $opt->id === $selectedOptionId,
                ];
            });

            $correctLetter = null;
            $selectedLetter = null;
            foreach ($optionsList as $optItem) {
                if ($optItem['is_correct']) $correctLetter = $optItem['letter'];
                if ($optItem['is_selected']) $selectedLetter = $optItem['letter'];
            }

            $explanation = $q->explanation ?: "The correct answer is Option {$correctLetter}: \"{$correctOption?->option_text}\".";
            $shortTrick = $q->short_trick ?: "Key concept: Focus on the core rule of {$q->topic} to quickly eliminate wrong options.";

            return [
                'id' => $q->id,
                'order_index' => $index + 1,
                'question_text' => $q->question_text,
                'topic' => $q->topic ?? 'General',
                'difficulty' => $q->difficulty ?? 'medium',
                'marks' => (float) $q->marks,
                'status' => $status,
                'marks_awarded' => $marksAwarded,
                'selected_option_id' => $selectedOptionId,
                'selected_option_letter' => $selectedLetter,
                'correct_option_id' => $correctOption?->id,
                'correct_option_letter' => $correctLetter,
                'options' => $optionsList,
                'explanation' => $explanation,
                'short_trick' => $shortTrick,
            ];
        });

        $totalAttempted = $answers->whereNotNull('selected_option_id')->count();
        $totalQuestions = $questions->count();

        return response()->json([
            'attempt_id' => $attempt->id,
            'test_id' => $test->id,
            'test_title' => $test->title,
            'candidate_name' => $attempt->user?->name ?? $attempt->guest_name ?? 'Anonymous Guest',
            'candidate_email' => $attempt->user?->email ?? $attempt->guest_email ?? '—',
            'submitted_at' => $attempt->submitted_at,
            'score' => (float) ($attempt->score ?? $stats['overall_percentage']),
            'total_questions' => $totalQuestions,
            'attempted_questions' => $totalAttempted,
            'unattempted_questions' => max(0, $totalQuestions - $totalAttempted),
            'correct_questions' => $stats['total_correct'],
            'wrong_questions' => $stats['total_wrong'],
            'total_earned_marks' => round($stats['total_earned'], 2),
            'total_possible_marks' => round($stats['total_possible'], 2),
            'has_negative_marking' => $hasNegative,
            'negative_mark' => $negativeMark,
            'questions' => $reviewQuestions,
        ]);
    }
}

