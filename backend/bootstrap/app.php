<?php

use App\Http\Middleware\EnsureAttemptOwnership;
use App\Http\Middleware\EnsureInstitutionScope;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Sanctum stateful SPA middleware for session-based auth on /api routes
        $middleware->statefulApi();

        $middleware->validateCsrfTokens(except: [
            'api/v1/auth/*',
            'sanctum/csrf-cookie',
        ]);

        // Named middleware aliases for use in routes
        $middleware->alias([
            'attempt.owner' => EnsureAttemptOwnership::class,
            'institution.scope' => EnsureInstitutionScope::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn(Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
