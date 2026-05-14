<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\EventResource;
use App\Models\Event;
use App\Models\QrCode;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class EventController extends Controller
{
    public function index(Request $request)
    {
        $status = $request->query('status', 'all');
        $q = $request->query('q');
        $perPage = (int) $request->query('per_page', 50);

        $query = Event::with(['cover', 'qrCode'])
            ->when($status && $status !== 'all', fn ($qb) => $qb->where('status', $status))
            ->when($q, fn ($qb) => $qb->where(function ($w) use ($q) {
                $w->where('title', 'like', "%{$q}%")
                    ->orWhere('location', 'like', "%{$q}%");
            }))
            ->orderBy('starts_at', 'desc');

        // Cache public (unauthenticated) requests for 5 minutes.
        if (! $request->user()) {
            $gen = (int) Cache::get('events.cache_gen', 0);
            $key = 'pub.events.v' . $gen . '.' . sha1(json_encode([$status, $q, $perPage]));
            $events = Cache::remember($key, 300, fn () => $query->limit($perPage)->get());
        } else {
            $events = $query->limit($perPage)->get();
        }

        return EventResource::collection($events);
    }

    public function show(Event $event)
    {
        $gen = (int) Cache::get('events.cache_gen', 0);
        $key = 'pub.event.v' . $gen . '.' . $event->id;
        $loaded = Cache::remember($key, 600, fn () => $event->load(['media', 'cover', 'qrCode', 'surveys']));

        return new EventResource($loaded);
    }

    public function adminShow(Event $event)
    {
        // Auto-create a QR code if this event was created before auto-QR was added
        if (! $event->qr_code_id) {
            $qr = QrCode::create([
                'target_type' => Event::class,
                'target_id'   => $event->id,
                'token'       => Str::random(16),
            ]);
            $event->update(['qr_code_id' => $qr->id]);
        }

        $event->load(['media', 'cover', 'qrCode']);

        return new EventResource($event);
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);

        $data['slug'] ??= Str::slug($data['title']) . '-' . Str::random(5);
        $data['created_by'] = $request->user()?->id;
        $data['published_at'] ??= now();

        $event = Event::create($data);

        // Auto-create QR code
        $qr = QrCode::create([
            'target_type' => Event::class,
            'target_id' => $event->id,
            'token' => Str::random(16),
        ]);
        $event->update(['qr_code_id' => $qr->id]);

        $event->load(['media', 'cover', 'qrCode']);
        $this->bustEventCache();

        return new EventResource($event);
    }

    public function update(Request $request, Event $event)
    {
        $data = $this->validateData($request, $event);
        $event->update($data);
        $event->load(['media', 'cover', 'qrCode']);
        $this->bustEventCache();

        return new EventResource($event);
    }

    public function destroy(Event $event)
    {
        // Delete all associated media files from storage first
        foreach ($event->media as $media) {
            Storage::disk('public')->delete($media->path);
        }

        $event->delete();
        $this->bustEventCache();

        return response()->noContent();
    }

    private function bustEventCache(): void
    {
        Cache::increment('events.cache_gen');
    }

    private function validateData(Request $request, ?Event $event = null): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('events', 'slug')->ignore($event?->id)],
            'description' => ['nullable', 'string'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after_or_equal:starts_at'],
            'location' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'capacity' => ['nullable', 'integer', 'min:0'],
            'requires_registration' => ['nullable', 'boolean'],
            'status' => ['nullable', 'in:upcoming,ongoing,completed,cancelled'],
            'published_at' => ['nullable', 'date'],
        ]);
    }
}
