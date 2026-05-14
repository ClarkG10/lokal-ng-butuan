<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class SurveyResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'title' => $this->title,
            'description' => $this->description,
            'status' => $this->status,
            'starts_at' => optional($this->starts_at)->toIso8601String(),
            'ends_at' => optional($this->ends_at)->toIso8601String(),
            'qr_token' => $this->whenLoaded('qrCode', fn () => $this->qrCode?->token),
            'event_id' => $this->event_id,
            'event' => $this->whenLoaded('event', fn () => $this->event ? [
                'id' => $this->event->id,
                'title' => $this->event->title,
                'description' => $this->event->description,
                'starts_at' => optional($this->event->starts_at)->toIso8601String(),
                'ends_at' => optional($this->event->ends_at)->toIso8601String(),
                'location' => $this->event->location ?? null,
                'cover_url' => $this->event->cover_media_id
                    ? \Illuminate\Support\Facades\Storage::url(
                        \App\Models\EventMedia::find($this->event->cover_media_id)?->path ?? ''
                      )
                    : null,
            ] : null),
            'questions' => $this->whenLoaded('questions', fn () => $this->questions->map(fn ($q) => [
                'id' => $q->id,
                'step' => (int) $q->step,
                'sort_order' => (int) $q->sort_order,
                'type' => $q->type,
                'label' => $q->label,
                'help_text' => $q->help_text,
                'options' => $q->options,
                'is_required' => (bool) $q->is_required,
                'visibility_rules' => $q->visibility_rules,
            ])),
        ];
    }
}
