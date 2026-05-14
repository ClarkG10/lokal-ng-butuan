<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\AnnouncementResource;
use App\Models\Announcement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Mews\Purifier\Facades\Purifier;

class AnnouncementController extends Controller
{
    public function index(Request $request)
    {
        $query = Announcement::with('category')
            ->when(! $request->user(), fn ($q) => $q->where('status', 'published')->whereNotNull('published_at')
                ->where(fn ($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', now())))
            ->when($request->query('status'), fn ($q, $s) => $q->where('status', $s))
            ->when($request->query('q'), fn ($q, $term) => $q->where('title', 'like', "%{$term}%"))
            ->orderByDesc('published_at')
            ->orderByDesc('id');

        // Cache public (unauthenticated) requests for 5 minutes.
        if (! $request->user()) {
            $gen = (int) Cache::get('announcements.cache_gen', 0);
            $key = 'pub.announcements.v' . $gen . '.' . sha1(json_encode([$request->query('q')]));
            $items = Cache::remember($key, 300, fn () => $query->limit(50)->get());
        } else {
            $items = $query->limit(50)->get();
        }

        return AnnouncementResource::collection($items);
    }

    public function show(Announcement $announcement)
    {
        $gen = (int) Cache::get('announcements.cache_gen', 0);
        $key = 'pub.announcement.v' . $gen . '.' . $announcement->id;
        $loaded = Cache::remember($key, 600, fn () => $announcement->load('category'));

        return new AnnouncementResource($loaded);
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        $data['slug'] ??= Str::slug($data['title']) . '-' . Str::random(5);
        $data['author_id'] = $request->user()?->id;
        if (! empty($data['body_rich'])) {
            $data['body_rich'] = Purifier::clean($data['body_rich']);
        }

        $a = Announcement::create($data);
        $this->bustAnnouncementCache();

        return new AnnouncementResource($a);
    }

    public function update(Request $request, Announcement $announcement)
    {
        $data = $this->validateData($request, $announcement);
        if (! empty($data['body_rich'])) {
            $data['body_rich'] = Purifier::clean($data['body_rich']);
        }

        $announcement->update($data);
        $this->bustAnnouncementCache();

        return new AnnouncementResource($announcement);
    }

    public function destroy(Announcement $announcement)
    {
        $announcement->delete();
        $this->bustAnnouncementCache();

        return response()->noContent();
    }

    private function bustAnnouncementCache(): void
    {
        Cache::increment('announcements.cache_gen');
    }

    private function validateData(Request $request, ?Announcement $announcement = null): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('announcements', 'slug')->ignore($announcement?->id)],
            'excerpt' => ['nullable', 'string', 'max:512'],
            'body_rich' => ['nullable', 'string'],
            'status' => ['nullable', 'in:draft,published'],
            'published_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date'],
            'category_id' => ['nullable', 'integer', 'exists:announcement_categories,id'],
        ]);
    }
}
