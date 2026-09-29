<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateShareRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'label' => 'nullable|string|max:100',
            'max_participants' => 'nullable|integer|min:1',
            'expires_at' => 'nullable|date|after:now',
        ];
    }
}

