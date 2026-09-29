<?php

namespace App\Models;

use App\Enums\AttemptStatus;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Attempt extends Model
{
    use HasFactory;

    protected $fillable = [
        'test_id',
        'share_id',
        'user_id',
        'guest_name',
        'guest_email',
        'started_at',
        'submitted_at',
        'expires_at',
        'score',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'submitted_at' => 'datetime',
            'expires_at' => 'datetime',
            'score' => 'decimal:2',
            'status' => AttemptStatus::class,
        ];
    }

    // ─── Accessors ────────────────────────────────────────────────────────────

    protected function isExpired(): Attribute
    {
        return Attribute::make(
            get: fn() => $this->status === AttemptStatus::InProgress
                && $this->expires_at->isPast(),
        );
    }

    protected function timeRemainingSeconds(): Attribute
    {
        return Attribute::make(
            get: fn() => max(0, (int) now()->diffInSeconds($this->expires_at, false)),
        );
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    public function test(): BelongsTo
    {
        return $this->belongsTo(Test::class);
    }

    public function share(): BelongsTo
    {
        return $this->belongsTo(TestShare::class, 'share_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function answers(): HasMany
    {
        return $this->hasMany(AttemptAnswer::class);
    }

    public function report(): HasOne
    {
        return $this->hasOne(AttemptReport::class);
    }
}

