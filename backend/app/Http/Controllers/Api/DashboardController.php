<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attempt;
use App\Models\Institution;
use App\Models\Test;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        return match (true) {
            $user->hasRole('institution_admin') => $this->adminDashboard($user),
            $user->hasRole('teacher') => $this->teacherDashboard($user),
            $user->hasRole('student') => $this->studentDashboard($user),
            default => $this->individualDashboard($user),
        };
    }

    private function individualDashboard($user): \Illuminate\Http\JsonResponse
    {
        $tests = Test::where('creator_id', $user->id)->withCount('attempts')->get();

        return response()->json([
            'role' => 'individual',
            'total_tests' => $tests->count(),
            'published_tests' => $tests->where('status', 'published')->count(),
            'total_attempts' => $tests->sum('attempts_count'),
            'tests' => $tests->take(5)->values(),
        ]);
    }

    private function teacherDashboard($user): \Illuminate\Http\JsonResponse
    {
        $classIds = $user->classes()->pluck('id');
        $testCount = Test::where('creator_id', $user->id)->count();
        $attemptCount = Attempt::whereHas('test', fn($q) => $q->where('creator_id', $user->id))->count();

        return response()->json([
            'role' => 'teacher',
            'class_count' => $classIds->count(),
            'test_count' => $testCount,
            'total_attempts' => $attemptCount,
        ]);
    }

    private function adminDashboard($user): \Illuminate\Http\JsonResponse
    {
        $institution = Institution::find($user->institution_id);
        $testCount = Test::where('institution_id', $user->institution_id)->count();
        $attemptCount = Attempt::whereHas(
            'test',
            fn($q) => $q->where('institution_id', $user->institution_id)
        )->count();

        return response()->json([
            'role' => 'institution_admin',
            'institution' => $institution,
            'test_count' => $testCount,
            'total_attempts' => $attemptCount,
        ]);
    }

    private function studentDashboard($user): \Illuminate\Http\JsonResponse
    {
        $attempts = Attempt::where('user_id', $user->id)
            ->where('status', 'submitted')
            ->with('test')
            ->latest('submitted_at')
            ->take(10)
            ->get();

        return response()->json([
            'role' => 'student',
            'total_attempts' => $attempts->count(),
            'average_score' => round((float) $attempts->avg('score'), 2),
            'recent_attempts' => $attempts->values(),
        ]);
    }
}

