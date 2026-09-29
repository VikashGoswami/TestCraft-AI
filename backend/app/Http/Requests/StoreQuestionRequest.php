<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreQuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'question_text' => 'required|string',
            'topic' => 'nullable|string|max:100',
            'difficulty' => 'nullable|in:easy,medium,hard',
            'marks' => 'nullable|numeric|min:0|max:100',
            'options' => 'required|array|min:2|max:6',
            'options.*.option_text' => 'required|string',
            'options.*.is_correct' => 'required|boolean',
        ];
    }
}

