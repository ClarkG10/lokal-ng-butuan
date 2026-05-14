<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Str;

class QrCode extends Model
{
    protected $fillable = ['token', 'target_type', 'target_id', 'scan_count'];

    protected static function booted(): void
    {
        static::creating(function (self $qr) {
            $qr->token ??= Str::random(16);
        });
    }

    public function target(): MorphTo
    {
        return $this->morphTo();
    }

    public function scans(): HasMany
    {
        return $this->hasMany(QrScan::class);
    }
}
