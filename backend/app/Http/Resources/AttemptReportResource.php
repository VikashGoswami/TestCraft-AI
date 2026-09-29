<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class AttemptReportResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'attempt_id' => $this->attempt_id,
            'strong_topics' => $this->strong_topics ?? [],
            'weak_topics' => $this->weak_topics ?? [],
            'ai_summary' => $this->ai_summary,
            'topic_advice' => $this->topic_advice ?? [],
            'generation_status' => $this->generation_status,
            'created_at' => $this->created_at,
        ];
    }
}

