<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StartAttemptRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        // Populate user resolver if user is authenticated via session/sanctum
        if (!$this->user()) {
            $user = Auth::guard('sanctum')->user() ?? Auth::guard('web')->user() ?? Auth::user();
            if ($user) {
                $this->setUserResolver(fn() => $user);
            }
        }

        // Support aliases 'name' and 'email' as well as 'guest_name' and 'guest_email'
        if ($this->has('name') && !$this->has('guest_name')) {
            $this->merge(['guest_name' => $this->input('name')]);
        }
        if ($this->has('email') && !$this->has('guest_email')) {
            $this->merge(['guest_email' => $this->input('email')]);
        }
    }

    public function rules(): array
    {
        $isLoggedIn = $this->authenticatedUser() !== null;

        if ($isLoggedIn) {
            return [
                'share_slug' => 'nullable|string|exists:test_shares,slug',
                'guest_name' => 'nullable|string|max:100',
                'guest_email' => 'nullable|email|max:255',
            ];
        }

        return [
            'share_slug' => 'nullable|string|exists:test_shares,slug',
            'guest_name' => 'required|string|max:100',
            'guest_email' => 'required|email|max:255',
        ];
    }

    public function messages(): array
    {
        return [
            'guest_name.required' => 'Name is required to start the test without login.',
            'guest_email.required' => 'Email ID is required to start the test without login.',
            'guest_email.email' => 'Please provide a valid email address.',
        ];
    }

    public function authenticatedUser()
    {
        return $this->user()
            ?? Auth::guard('sanctum')->user()
            ?? Auth::guard('web')->user()
            ?? Auth::user();
    }
}
