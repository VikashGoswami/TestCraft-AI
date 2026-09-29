<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ShareResource extends JsonResource
{
    public function toArray($request): array
    {
        $frontendUrl = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:3000')), '/');

        return [
            'id' => $this->id,
            'test_id' => $this->test_id,
            'label' => $this->label,
            'slug' => $this->slug,
            'url' => $frontendUrl . '/take/' . $this->slug,
            'max_participants' => $this->max_participants,
            'expires_at' => $this->expires_at,
            'view_count' => $this->view_count,
            'start_count' => $this->start_count,
            'completion_count' => $this->completion_count,
            'completion_rate' => $this->completion_rate,
            'remaining_slots' => $this->remaining_slots,
            'created_at' => $this->created_at,
        ];
    }
}

