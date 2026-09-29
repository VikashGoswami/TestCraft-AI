<?php

namespace App\Models;

use App\Enums\TemplateKey;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TestTheme extends Model
{
    use HasFactory;

    protected $fillable = [
        'test_id',
        'institution_id',
        'template_key',
        'primary_color',
        'accent_color',
        'logo_path',
        'layout_config',
    ];

    protected function casts(): array
    {
        return [
            'layout_config' => 'array',
            'template_key' => TemplateKey::class,
        ];
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    public function test(): BelongsTo
    {
        return $this->belongsTo(Test::class);
    }
}

