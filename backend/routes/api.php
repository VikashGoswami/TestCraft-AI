<?php

use App\Http\Controllers\Api\AttemptController;
use App\Http\Controllers\Api\AttemptReportController;
use App\Http\Controllers\Api\Auth\GoogleAuthController;
use App\Http\Controllers\Api\Auth\RegisterController;
use App\Http\Controllers\Api\Auth\SessionController;
use App\Http\Controllers\Api\ClassController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\InstitutionController;
use App\Http\Controllers\Api\QuestionController;
use App\Http\Controllers\Api\QuestionPaperController;
use App\Http\Controllers\Api\ShareController;
use App\Http\Controllers\Api\TestController;
use App\Http\Controllers\Api\ThemeController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    // ─── Public Health Check ──────────────────────────────────────────────────
    Route::get('health', function () {
        $database = 'connected';
        try {
            \Illuminate\Support\Facades\DB::connection()->getPdo();
        } catch (\Throwable $e) {
            $database = 'error: ' . $e->getMessage();
        }

        return response()->json([
            'status' => 'healthy',
            'service' => 'TestCraft-AI Backend API',
            'database' => $database,
            'php' => PHP_VERSION,
            'timestamp' => now()->toIso8601String(),
        ]);
    });

    // ─── Public Auth ──────────────────────────────────────────────────────────
    Route::post('auth/register', [RegisterController::class, 'register']);
    Route::post('auth/login', [SessionController::class, 'login']);
    Route::post('auth/logout', [SessionController::class, 'logout']);
    Route::post('auth/google/token-signin', [GoogleAuthController::class, 'tokenSignIn']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('auth/me', [SessionController::class, 'me']);
        Route::patch('auth/me', [SessionController::class, 'updateMe']);
    });

    // ─── Public Share Resolution (no auth required) ──────────────────────────
    Route::get('shares/{slug}', [ShareController::class, 'resolve']);

    // ─── Authenticated Routes ─────────────────────────────────────────────────
    Route::middleware('auth:sanctum')->group(function () {

        Route::get('dashboard', [DashboardController::class, 'index']);

        // Tests (CRUD + extras)
        Route::apiResource('tests', TestController::class);
        Route::get('tests/{test}/attempts', [TestController::class, 'attempts']);
        Route::post('tests/{test}/theme', [ThemeController::class, 'store']);

        // Questions
        Route::post('tests/{test}/questions', [QuestionController::class, 'store']);
        Route::patch('tests/{test}/questions/{question}', [QuestionController::class, 'update']);
        Route::delete('tests/{test}/questions/{question}', [QuestionController::class, 'destroy']);
        Route::post('tests/{test}/questions/bulk-upload', [QuestionController::class, 'bulkUpload']);

        // Share management (creating/listing shares for a test)
        Route::post('tests/{test}/shares', [ShareController::class, 'store']);
        Route::get('tests/{test}/shares', [ShareController::class, 'index']);

        // Institutions
        Route::post('institutions', [InstitutionController::class, 'store']);
        Route::get('institutions/{institution}', [InstitutionController::class, 'show']);
        Route::get('institutions/{institution}/teachers', [InstitutionController::class, 'teachers']);
        Route::post('institutions/{institution}/teachers', [InstitutionController::class, 'inviteTeacher']);
        Route::get('institutions/{institution}/classes', [ClassController::class, 'index']);
        Route::post('institutions/{institution}/classes', [ClassController::class, 'store']);

        // Classes
        Route::get('classes/my', [ClassController::class, 'myClasses']);
        Route::post('classes/join', [ClassController::class, 'join']);
        Route::post('classes/{class}/students', [ClassController::class, 'addStudent']);
        Route::post('classes/{class}/assign-test', [ClassController::class, 'assignTest']);

        // User's own attempts listing (for analytics/AI insights)
        Route::get('attempts', [AttemptController::class, 'index']);

        // AI Question Paper Extraction (individual, teacher, institution_admin only)
        Route::post('question-papers/extract', [QuestionPaperController::class, 'extract']);
    });

    // ─── Attempt Routes (work for both authenticated users and guests) ─────────
    Route::post('tests/{test}/attempts', [AttemptController::class, 'store']);
    Route::get('attempts/{attempt}', [AttemptController::class, 'show'])->middleware('attempt.owner');
    Route::patch('attempts/{attempt}/answers', [AttemptController::class, 'updateAnswer'])->middleware('attempt.owner');
    Route::post('attempts/{attempt}/submit', [AttemptController::class, 'submit'])->middleware('attempt.owner');
    Route::get('attempts/{attempt}/report', [AttemptReportController::class, 'show'])->middleware('attempt.owner');
    Route::get('attempts/{attempt}/review', [AttemptController::class, 'review'])->middleware('attempt.owner');

    // On-demand AI Explanation and Short Trick for questions
    Route::post('questions/{question}/ai-explanation', [QuestionController::class, 'aiExplanation']);
});
