<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Event extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'slug', 'title', 'description', 'starts_at', 'ends_at',
        'location', 'address', 'lat', 'lng', 'status',
        'capacity', 'requires_registration', 'cover_media_id',
        'qr_code_id', 'published_at', 'created_by',
    ];

    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'published_at' => 'datetime',
        'requires_registration' => 'boolean',
    ];

    public function media(): HasMany
    {
        return $this->hasMany(EventMedia::class)->orderBy('sort_order');
    }

    public function cover(): BelongsTo
    {
        return $this->belongsTo(EventMedia::class, 'cover_media_id');
    }

    public function qrCode(): BelongsTo
    {
        return $this->belongsTo(QrCode::class);
    }

    public function comments(): MorphOne
    {
        return $this->morphOne(Comment::class, 'commentable');
    }

    public function surveys(): HasMany
    {
        return $this->hasMany(Survey::class)->where('status', 'active');
    }
}
