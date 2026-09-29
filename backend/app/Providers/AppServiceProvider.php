<?php

namespace App\Providers;

use App\Events\AttemptSubmitted;
use App\Listeners\GenerateAttemptReport;
use App\Models\Attempt;
use App\Models\Institution;
use App\Models\SchoolClass;
use App\Models\Test;
use App\Policies\AttemptPolicy;
use App\Policies\ClassPolicy;
use App\Policies\InstitutionPolicy;
use App\Policies\TestPolicy;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // ─── Event → Listener mappings ────────────────────────────────────────
        Event::listen(AttemptSubmitted::class, GenerateAttemptReport::class);

        // ─── Policy registrations ─────────────────────────────────────────────
        Gate::policy(Test::class, TestPolicy::class);
        Gate::policy(Attempt::class, AttemptPolicy::class);
        Gate::policy(Institution::class, InstitutionPolicy::class);
        Gate::policy(SchoolClass::class, ClassPolicy::class);
    }
}
