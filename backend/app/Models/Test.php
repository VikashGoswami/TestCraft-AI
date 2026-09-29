<?php

namespace App\Models;

use App\Enums\TestVisibility;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Test extends Model
{
    use HasFactory;

    protected $fillable = [
        'creator_id',
        'institution_id',
        'school_class_id',
        'owner_type',
        'title',
        'description',
        'duration_minutes',
        'visibility',
        'passing_score',
        'shuffle_questions',
        'shuffle_options',
        'status',
        'has_negative_marking',
        'negative_mark',
    ];

    protected function casts(): array
    {
        return [
            'visibility' => TestVisibility::class,
            'shuffle_questions' => 'boolean',
            'shuffle_options' => 'boolean',
            'has_negative_marking' => 'boolean',
            'negative_mark' => 'decimal:2',
        ];
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'school_class_id');
    }

    public function questions(): HasMany
    {
        return $this->hasMany(Question::class);
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(Attempt::class);
    }

    public function shares(): HasMany
    {
        return $this->hasMany(TestShare::class);
    }

    public function theme(): HasOne
    {
        return $this->hasOne(TestTheme::class);
    }
}

