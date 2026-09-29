<?php

namespace App\Http\Middleware;

use App\Models\Attempt;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAttemptOwnership
{
    /**
     * Verify the request is from either:
     *  - the authenticated user who owns this attempt, or
     *  - a guest who has the attempt ID stored in their session.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $routeParam = $request->route('attempt');

        $attempt = $routeParam instanceof Attempt
            ? $routeParam
            : Attempt::findOrFail($routeParam);

        $user = $request->user()
            ?? \Illuminate\Support\Facades\Auth::guard('sanctum')->user()
            ?? \Illuminate\Support\Facades\Auth::guard('web')->user()
            ?? \Illuminate\Support\Facades\Auth::user();

        // Authenticated user: check user_id ownership or test creator
        if ($user && ($attempt->user_id === $user->id || $attempt->test->creator_id === $user->id)) {
            return $next($request);
        }

        // Guest: check session-stored attempt ID set during attempt creation.
        if (!$user && $request->hasSession() && $request->session()->get('guest_attempt_id') === $attempt->id) {
            return $next($request);
        }

        // For viewing submitted attempt results (read-only GET requests), allow viewing
        if ($request->isMethod('get') && $attempt->status === \App\Enums\AttemptStatus::Submitted) {
            return $next($request);
        }

        return response()->json(['message' => 'Unauthorized.'], 403);
    }
}

