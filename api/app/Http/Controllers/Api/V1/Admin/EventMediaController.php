<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\EventMediaResource;
use App\Jobs\ProcessEventMedia;
use App\Models\Event;
use App\Models\EventMedia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class EventMediaController extends Controller
{
    public function store(Request $request, Event $event)
    {
        $request->validate([
            'file' => ['required', 'image', 'max:8192'],
            'orientation' => ['required', 'in:landscape,portrait'],
            'alt_text' => ['nullable', 'string', 'max:255'],
        ]);

        $path = $request->file('file')->store("events/{$event->id}", 'public');

        $media = $event->media()->create([
            'path' => $path,
            'orientation' => $request->input('orientation'),
            'alt_text' => $request->input('alt_text'),
            'is_cover' => $event->media()->count() === 0,
            'sort_order' => $event->media()->count(),
        ]);

        if ($media->is_cover) {
            $event->update(['cover_media_id' => $media->id]);
        }

        ProcessEventMedia::dispatch($media->id);

        return new EventMediaResource($media);
    }

    public function reorder(Request $request, Event $event)
    {
        $ids = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'exists:event_media,id'],
        ])['ids'];

        foreach ($ids as $i => $id) {
            EventMedia::where('id', $id)->where('event_id', $event->id)
                ->update(['sort_order' => $i, 'is_cover' => $i === 0]);
        }

        if (! empty($ids)) {
            $event->update(['cover_media_id' => $ids[0]]);
        }

        return response()->noContent();
    }

    public function destroy(Event $event, EventMedia $media)
    {
        abort_if($media->event_id !== $event->id, 404);

        Storage::disk('public')->delete($media->path);
        $media->delete();

        if ($event->cover_media_id === $media->id) {
            $next = $event->media()->orderBy('sort_order')->first();
            $event->update(['cover_media_id' => $next?->id]);
            if ($next) {
                $next->update(['is_cover' => true]);
            }
        }

        return response()->noContent();
    }
}
