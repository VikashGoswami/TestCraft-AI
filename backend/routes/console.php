<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Jobs\AutoSubmitExpiredAttemptsJob;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Auto-submit expired attempts every minute.
Schedule::job(new AutoSubmitExpiredAttemptsJob())->everyMinute();
