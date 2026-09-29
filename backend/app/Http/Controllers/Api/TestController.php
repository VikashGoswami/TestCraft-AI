<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTestRequest;
use App\Http\Resources\TestResource;
use App\Models\Test;
use Illuminate\Http\Request;

class TestController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', Test::class);

        $user = $request->user();

        $query = Test::with(['creator', 'theme'])->withCount('questions');

        if ($user->hasRole('institution_admin')) {
            $query->where('institution_id', $user->institution_id);
        } elseif ($user->hasRole('teacher')) {
            $query->where('creator_id', $user->id);
        } elseif ($user->hasRole('student')) {
            $classIds = $user->enrolledClasses()->pluck('school_classes.id');
            $query->whereIn('school_class_id', $classIds)->where('status', 'published');
        } else {
            // individual
            $query->where('creator_id', $user->id);
        }

        return TestResource::collection($query->latest()->paginate(20));
    }

    public function store(StoreTestRequest $request)
    {
        $this->authorize('create', Test::class);

        $user = $request->user();

        $test = Test::create(array_merge($request->validated(), [
            'creator_id' => $user->id,
            'institution_id' => $user->institution_id,
            'owner_type' => $user->institution_id ? 'institution' : 'individual',
        ]));

        return new TestResource($test->load('creator'));
    }

    public function show(Test $test)
    {
        $this->authorize('view', $test);

        return new TestResource($test->load(['creator', 'questions.options', 'theme']));
    }

    public function update(StoreTestRequest $request, Test $test)
    {
        $this->authorize('update', $test);

        $test->update($request->validated());

        return new TestResource($test->fresh(['creator', 'theme']));
    }

    public function destroy(Test $test)
    {
        $this->authorize('delete', $test);

        $test->delete();

        return response()->json(['message' => 'Test deleted.']);
    }

    /**
     * List all attempts for a test (for results view by creator/admin/teacher).
     */
    public function attempts(Request $request, Test $test)
    {
        $this->authorize('viewResults', $test);

        $totalQuestions = $test->questions()->count();
        $scoringService = app(\App\Services\ScoringService::class);

        $attempts = $test->attempts()
            ->with(['user', 'share', 'answers.selectedOption', 'answers.question'])
            ->latest('submitted_at')
            ->paginate(50);

        $attempts->getCollection()->transform(function ($att) use ($scoringService, $totalQuestions) {
            $stats = $scoringService->score($att);
            $attempted = $att->answers->whereNotNull('selected_option_id')->count();
            $unattempted = max(0, ($stats['total_questions'] ?: $totalQuestions) - $attempted);

            $att->total_questions = $stats['total_questions'] ?: $totalQuestions;
            $att->attempted_count = $attempted;
            $att->unattempted_count = $unattempted;
            $att->correct_count = $stats['total_correct'];
            $att->wrong_count = $stats['total_wrong'];
            $att->total_earned_marks = round($stats['total_earned'], 2);
            $att->total_possible_marks = round($stats['total_possible'], 2);

            return $att;
        });

        return response()->json($attempts);
    }
}

