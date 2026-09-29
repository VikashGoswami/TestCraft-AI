<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\TimerService;
use App\Models\Attempt;
use App\Enums\AttemptStatus;
use Carbon\Carbon;

class TimerServiceTest extends TestCase
{
    private TimerService $timerService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->timerService = new TimerService();
    }

    public function test_computes_correct_expires_at()
    {
        $now = Carbon::create(2026, 1, 1, 12, 0, 0);
        Carbon::setTestNow($now);

        $expiresAt = $this->timerService->computeExpiresAt(60);

        $this->assertEquals($now->copy()->addMinutes(60), $expiresAt);
    }

    public function test_remaining_seconds_calculation()
    {
        $now = Carbon::create(2026, 1, 1, 12, 0, 0);
        Carbon::setTestNow($now);

        $attempt = new Attempt([
            'expires_at' => $now->copy()->addSeconds(300),
            'status' => AttemptStatus::InProgress,
        ]);

        $remaining = $this->timerService->getRemainingSeconds($attempt);
        $this->assertEquals(300, $remaining);
    }

    public function test_remaining_seconds_never_negative()
    {
        $now = Carbon::create(2026, 1, 1, 12, 0, 0);
        Carbon::setTestNow($now);

        $attempt = new Attempt([
            'expires_at' => $now->copy()->subMinutes(10),
            'status' => AttemptStatus::InProgress,
        ]);

        $remaining = $this->timerService->getRemainingSeconds($attempt);
        $this->assertEquals(0, $remaining);
    }

    public function test_is_expired_detection()
    {
        $now = Carbon::create(2026, 1, 1, 12, 0, 0);
        Carbon::setTestNow($now);

        $activeAttempt = new Attempt([
            'expires_at' => $now->copy()->addMinutes(5),
            'status' => AttemptStatus::InProgress,
        ]);
        $this->assertFalse($this->timerService->isExpired($activeAttempt));

        $expiredAttempt = new Attempt([
            'expires_at' => $now->copy()->subSeconds(1),
            'status' => AttemptStatus::InProgress,
        ]);
        $this->assertTrue($this->timerService->isExpired($expiredAttempt));
    }
}

