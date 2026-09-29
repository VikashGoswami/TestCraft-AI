<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class TestResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'duration_minutes' => $this->duration_minutes,
            'visibility' => $this->visibility,
            'passing_score' => $this->passing_score,
            'shuffle_questions' => $this->shuffle_questions,
            'shuffle_options' => $this->shuffle_options,
            'status' => $this->status,
            'owner_type' => $this->owner_type,
            'has_negative_marking' => (bool) $this->has_negative_marking,
            'negative_mark' => $this->negative_mark,
            'question_count' => $this->whenCounted('questions'),
            'creator' => [
                'id' => $this->creator->id,
                'name' => $this->creator->name,
            ],
            'theme' => $this->whenLoaded('theme', fn() => [
                'template_key' => $this->theme->template_key,
                'primary_color' => $this->theme->primary_color,
                'accent_color' => $this->theme->accent_color,
                'layout_config' => $this->theme->layout_config,
            ]),
            'questions' => $this->whenLoaded('questions', fn() =>
                $this->questions->map(fn($q) => [
                    'id' => $q->id,
                    'test_id' => $q->test_id,
                    'question_text' => $q->question_text,
                    'topic' => $q->topic,
                    'difficulty' => $q->difficulty,
                    'order_index' => $q->order_index,
                    'marks' => $q->marks ?? 1.00,
                    'options' => $q->relationLoaded('options') ? $q->options->map(fn($o) => [
                        'id' => $o->id,
                        'question_id' => $o->question_id,
                        'option_text' => $o->option_text,
                        'is_correct' => (bool) $o->is_correct,
                    ]) : [],
                ])
            ),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}

