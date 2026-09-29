<?php

namespace App\Models;

use App\Enums\GenerationStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttemptReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'attempt_id',
        'strong_topics',
        'weak_topics',
        'ai_summary',
        'topic_advice',
        'generation_status',
    ];

    protected function casts(): array
    {
        return [
            'strong_topics' => 'array',
            'weak_topics' => 'array',
            'topic_advice' => 'array',
            'generation_status' => GenerationStatus::class,
        ];
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    public function attempt(): BelongsTo
    {
        return $this->belongsTo(Attempt::class);
    }
}

