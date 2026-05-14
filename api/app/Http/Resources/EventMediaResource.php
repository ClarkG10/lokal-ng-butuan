<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class EventMediaResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'url' => Storage::url($this->path),
            'orientation' => $this->orientation,
            'is_cover' => (bool) $this->is_cover,
            'sort_order' => (int) $this->sort_order,
            'alt_text' => $this->alt_text,
        ];
    }
}
