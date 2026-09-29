<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\GoogleTokenSignInRequest;
use App\Services\GoogleAuthService;
use Illuminate\Support\Facades\Auth;

class GoogleAuthController extends Controller
{
    public function __construct(private readonly GoogleAuthService $googleAuth) {}

    /**
     * Exchange a Google ID token (from the frontend Sign-In With Google flow)
     * for a session-authenticated user.
     */
    public function tokenSignIn(GoogleTokenSignInRequest $request)
    {
        try {
            $user = $this->googleAuth->handleIdToken($request->id_token);

            Auth::login($user);
            $request->session()->regenerate();

            // Flag new users so the frontend can redirect to role/onboarding selection.
            $isNew = $user->wasRecentlyCreated
                || !$user->hasAnyRole(['individual', 'institution_admin', 'teacher', 'student']);

            return response()->json([
                'user' => array_merge($user->toArray(), ['roles' => $user->getRoleNames()]),
                'is_new' => $isNew,
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}

