<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'duration_minutes' => 'required|integer|min:1|max:480',
            'visibility' => 'required|in:public,private,invite_only',
            'passing_score' => 'nullable|integer|min:0|max:100',
            'shuffle_questions' => 'boolean',
            'shuffle_options' => 'boolean',
            'status' => 'nullable|in:draft,published,archived',
            'has_negative_marking' => 'boolean',
            'negative_mark' => 'nullable|numeric|min:0|max:10',
        ];
    }
}

