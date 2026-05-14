<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class EventResource extends JsonResource
{
    public function toArray($request): array
    {
        $cover = $this->relationLoaded('cover') ? $this->cover : null;
        $coverUrl = $cover ? Storage::url($cover->path) : null;

        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'title' => $this->title,
            'description' => $this->description,
            'starts_at' => optional($this->starts_at)->toIso8601String(),
            'ends_at' => optional($this->ends_at)->toIso8601String(),
            'status' => $this->status,
            'location' => $this->location,
            'address' => $this->address,
            'capacity' => $this->capacity,
            'requires_registration' => (bool) $this->requires_registration,
            'cover_url' => $coverUrl,
            'qr_token' => $this->whenLoaded('qrCode', fn () => $this->qrCode?->token),
            'media' => EventMediaResource::collection($this->whenLoaded('media')),
            'surveys' => $this->whenLoaded('surveys', fn () => $this->surveys->map(fn ($s) => [
                'id' => $s->id,
                'slug' => $s->slug,
                'title' => $s->title,
                'description' => $s->description,
                'qr_token' => $s->qrCode?->token ?? null,
            ])->values()),
        ];
    }
}
