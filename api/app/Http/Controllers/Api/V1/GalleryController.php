<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\GalleryItem;
use Illuminate\Support\Facades\Cache;

class GalleryController extends Controller
{
    public function index()
    {
        $cacheKey = 'pub.gallery.v' . Cache::get('gallery.cache_gen', 1);

        $items = Cache::remember($cacheKey, 600, function () {
            return GalleryItem::orderBy('sort_order')->orderByDesc('created_at')->get();
        });

        return response()->json(['data' => $items]);
    }
}
