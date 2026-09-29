<?php

namespace App\Services;

use App\Models\TestShare;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ShareTrackingService
{
    /**
     * Increment view_count at most once per session per share link.
     */
    public function recordView(TestShare $share, Request $request): void
    {
        $id = $request->hasSession()
            ? $request->session()->getId()
            : md5($request->ip() . '_' . ($request->userAgent() ?? 'guest'));

        $sessionKey = 'share_view_' . $share->id . '_' . $id;

        if (Cache::add($sessionKey, true, now()->addHour())) {
            $share->increment('view_count');
        }
    }

    /**
     * Increment start_count when a participant begins the test.
     */
    public function recordStart(TestShare $share): void
    {
        $share->increment('start_count');
    }

    /**
     * Increment completion_count when a participant submits.
     */
    public function recordCompletion(TestShare $share): void
    {
        $share->increment('completion_count');
    }

    /**
     * Check whether the share link still has capacity for a new participant.
     * Returns true when max_participants is null (unlimited).
     */
    public function hasCapacity(TestShare $share): bool
    {
        if ($share->max_participants === null) {
            return true;
        }

        return $share->start_count < $share->max_participants;
    }

    /**
     * Check whether the share link's expiry has passed.
     */
    public function isExpired(TestShare $share): bool
    {
        return $share->expires_at !== null && $share->expires_at->isPast();
    }
}

