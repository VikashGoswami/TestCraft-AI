<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SessionController extends Controller
{
    public function login(Request $request)
    {
        try {
            $credentials = $request->validate([
                'email' => 'required|email',
                'password' => 'required|string',
            ]);

            if (!Auth::attempt($credentials, $request->boolean('remember'))) {
                return response()->json(['message' => 'Invalid credentials.'], 401);
            }

            if ($request->hasSession()) {
                $request->session()->regenerate();
            }

            $user = Auth::user();
            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'user' => array_merge($user->toArray(), ['roles' => $user->getRoleNames()]),
                'token' => $token,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Login error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Login error: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function logout(Request $request)
    {
        try {
            if (Auth::guard('web')->check()) {
                Auth::guard('web')->logout();
            }
            if ($request->hasSession()) {
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }
        } catch (\Throwable $e) {
            // Silently complete logout
        }

        return response()->json(['message' => 'Logged out.']);
    }

    public function me(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'user' => array_merge($user->toArray(), [
                'roles' => $user->getRoleNames(),
            ]),
        ]);
    }

    public function updateMe(Request $request)
    {
        $user = $request->user();
        $data = $request->validate([
            'name' => 'nullable|string|max:255',
            'role' => 'nullable|in:individual,institution_admin,teacher,student',
        ]);

        if (isset($data['name'])) {
            $user->update(['name' => $data['name']]);
        }

        if (isset($data['role'])) {
            $user->syncRoles([$data['role']]);
        }

        return response()->json([
            'user' => array_merge($user->fresh()->toArray(), [
                'roles' => $user->fresh()->getRoleNames(),
            ]),
        ]);
    }
}

