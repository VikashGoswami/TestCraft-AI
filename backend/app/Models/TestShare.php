<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TestShare extends Model
{
    use HasFactory;

    protected $fillable = [
        'test_id',
        'created_by_user_id',
        'label',
        'slug',
        'max_participants',
        'expires_at',
        'view_count',
        'start_count',
        'completion_count',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'max_participants' => 'integer',
        ];
    }

    // ─── Accessors ────────────────────────────────────────────────────────────

    protected function completionRate(): Attribute
    {
        return Attribute::make(
            get: fn() => round($this->completion_count / max($this->start_count, 1) * 100, 2),
        );
    }

    protected function remainingSlots(): Attribute
    {
        return Attribute::make(
            get: fn() => $this->max_participants
                ? max(0, $this->max_participants - $this->start_count)
                : null,
        );
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    public function test(): BelongsTo
    {
        return $this->belongsTo(Test::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(Attempt::class, 'share_id');
    }
}

