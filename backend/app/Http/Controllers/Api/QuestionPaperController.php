<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\GeminiExtractionService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class QuestionPaperController extends Controller
{
    public function __construct(
        private readonly GeminiExtractionService $gemini
    ) {}

    /**
     * Accept a question paper file and extract MCQ questions using Gemini AI.
     *
     * POST /api/v1/question-papers/extract
     * Body (multipart/form-data):
     *   - file: required, PDF/DOCX/JPG/PNG/TXT, max 20MB
     *   - context: optional string hint (e.g. "Class 10 Physics, CBSE")
     */
    public function extract(Request $request): JsonResponse
    {
        @set_time_limit(300);
        @ini_set('memory_limit', '512M');
        @ini_set('max_execution_time', '300');

        $request->validate([
            'file' => [
                'required',
                'file',
                'mimes:pdf,doc,docx,jpg,jpeg,png,webp,txt',
                'max:20480', // 20 MB
            ],
            'context' => 'nullable|string|max:500',
        ], [
            'file.required' => 'Please upload a question paper file.',
            'file.mimes'    => 'Supported formats: PDF, DOCX, DOC, JPG, PNG, TXT.',
            'file.max'      => 'File must be smaller than 20 MB.',
        ]);

        $file    = $request->file('file');
        $context = $request->input('context', '');

        try {
            $questions = $this->gemini->extractQuestions($file, $context);

            return response()->json([
                'success'    => true,
                'count'      => count($questions),
                'questions'  => $questions,
                'file_name'  => $file->getClientOriginalName(),
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        } catch (\RuntimeException $e) {
            Log::error('QuestionPaperController::extract failed', [
                'message' => $e->getMessage(),
                'file'    => $file->getClientOriginalName(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        } catch (\Throwable $e) {
            Log::error('QuestionPaperController unexpected error', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'An unexpected error occurred during extraction. Please try again.',
            ], 500);
        }
    }
}
