<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;

class RegisterController extends Controller
{
    public function register(Request $request)
    {
        try {
            $data = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users',
                'password' => ['required', 'confirmed', Rules\Password::defaults()],
                'role' => 'nullable|in:individual,institution_admin,teacher,student',
            ]);

            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'provider' => 'local',
            ]);

            $roleName = $data['role'] ?? 'individual';
            \Spatie\Permission\Models\Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
            $user->assignRole($roleName);

            // Safe session authentication (if session store is available on this request)
            try {
                Auth::login($user);
                if ($request->hasSession()) {
                    $request->session()->regenerate();
                }
            } catch (\Throwable $sessionError) {
                // Non-blocking fallback for stateless / non-session API requests
            }

            // Generate personal access token for cross-domain SPA / mobile auth
            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'user' => array_merge($user->toArray(), ['roles' => $user->getRoleNames()]),
                'token' => $token,
                'message' => 'Registration successful',
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Registration error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Registration failed: ' . $e->getMessage(),
            ], 500);
        }
    }
}

