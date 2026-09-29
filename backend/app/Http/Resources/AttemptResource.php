<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class AttemptResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'test_id' => $this->test_id,
            'status' => $this->status,
            'score' => $this->score,
            'started_at' => $this->started_at,
            'submitted_at' => $this->submitted_at,
            'expires_at' => $this->expires_at,
            'time_remaining_seconds' => $this->time_remaining_seconds,
            'guest_name' => $this->guest_name,
            'guest_email' => $this->guest_email,
            'user' => $this->whenLoaded('user', fn() => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
                'avatar_url' => $this->user->avatar_url,
            ]),
            'answers' => $this->whenLoaded('answers', fn() =>
                $this->answers->map(fn($a) => [
                    'question_id' => $a->question_id,
                    'selected_option_id' => $a->selected_option_id,
                    'state' => $a->state,
                ])
            ),
            'test' => $this->whenLoaded('test', fn() => new TestResource($this->test)),
        ];
    }
}

