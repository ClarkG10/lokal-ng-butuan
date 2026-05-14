<?php

namespace App\Jobs;

use App\Models\EventMedia;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Laravel\Facades\Image;

class ProcessEventMedia implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public int $mediaId) {}

    public function handle(): void
    {
        $media = EventMedia::find($this->mediaId);
        if (! $media) {
            return;
        }

        $disk = Storage::disk('public');
        if (! $disk->exists($media->path)) {
            return;
        }

        // Generate a 1600px wide variant (web) and a 480px thumb. Skip on failure.
        try {
            $original = $disk->get($media->path);
            $img = Image::read($original);
            $maxWidth = $media->orientation === 'portrait' ? 1200 : 1600;
            if ($img->width() > $maxWidth) {
                $img->scaleDown(width: $maxWidth);
                $disk->put($media->path, (string) $img->encode());
            }
        } catch (\Throwable) {
            // Soft-fail; original is preserved.
        }
    }
}
