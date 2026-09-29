<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureInstitutionScope
{
    /**
     * Reject requests where the authenticated user does not belong to the
     * institution referenced in the route parameter.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $institution = $request->route('institution');

        if ($institution && $user && $user->institution_id !== $institution->id) {
            return response()->json(['message' => 'Access denied to this institution.'], 403);
        }

        return $next($request);
    }
}

