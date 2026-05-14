<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class CommentResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'parent_id' => $this->parent_id,
            'commentable_type' => $this->commentable_type,
            'commentable_id' => $this->commentable_id,
            'commentable_title' => $this->whenLoaded('commentable', function () {
                return $this->commentable?->title ?? null;
            }),
            'author_name' => $this->author_name,
            'body' => $this->body,
            'status' => $this->status,
            'is_pinned' => (bool) $this->is_pinned,
            'created_at' => optional($this->created_at)->toIso8601String(),
            'reactions_count' => $this->whenLoaded('reactions', function () {
                return $this->reactions->groupBy('type')->map->count();
            }, (object) []),
            'replies' => CommentResource::collection($this->whenLoaded('replies')),
        ];
    }
}
