<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\GalleryItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class GalleryController extends Controller
{
    public function index()
    {
        $items = GalleryItem::orderBy('sort_order')->orderByDesc('created_at')->get();
        return response()->json(['data' => $items]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'image'   => 'required|image|mimes:jpeg,jpg,png,webp|max:10240',
            'caption' => 'nullable|string|max:255',
        ]);

        $path = $request->file('image')->store('gallery', 'public');

        $item = GalleryItem::create([
            'path'        => $path,
            'caption'     => $request->input('caption'),
            'sort_order'  => GalleryItem::max('sort_order') + 1,
            'uploaded_by' => $request->user()->id,
        ]);

        $this->bustCache();

        return response()->json(['data' => $item], 201);
    }

    public function update(Request $request, GalleryItem $item)
    {
        $request->validate([
            'caption' => 'nullable|string|max:255',
        ]);

        $item->update($request->only('caption'));
        $this->bustCache();

        return response()->json(['data' => $item]);
    }

    public function destroy(GalleryItem $item)
    {
        Storage::disk('public')->delete($item->path);
        $item->delete();
        $this->bustCache();

        return response()->json(null, 204);
    }

    public function reorder(Request $request)
    {
        $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'integer|exists:gallery_items,id',
        ]);

        foreach ($request->ids as $order => $id) {
            GalleryItem::where('id', $id)->update(['sort_order' => $order]);
        }

        $this->bustCache();

        return response()->json(['message' => 'Reordered.']);
    }

    private function bustCache(): void
    {
        Cache::increment('gallery.cache_gen');
    }
}
