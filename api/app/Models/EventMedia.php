<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventMedia extends Model
{
    protected $table = 'event_media';

    protected $fillable = [
        'event_id', 'path', 'orientation', 'is_cover', 'sort_order', 'alt_text',
    ];

    protected $casts = [
        'is_cover' => 'boolean',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }
}
