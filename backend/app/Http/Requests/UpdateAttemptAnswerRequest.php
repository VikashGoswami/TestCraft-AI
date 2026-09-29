<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAttemptAnswerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'question_id' => 'required|exists:questions,id',
            'selected_option_id' => 'nullable|exists:options,id',
            'action' => 'required|in:visit,save,mark,clear',
        ];
    }
}

