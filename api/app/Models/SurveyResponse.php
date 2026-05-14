<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SurveyResponse extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'survey_id', 'masterlist_id', 'submitted_at',
        'ip_hash', 'user_agent', 'via_qr',
        'latitude', 'longitude', 'location_name',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'via_qr' => 'boolean',
    ];

    public function survey(): BelongsTo
    {
        return $this->belongsTo(Survey::class);
    }

    public function masterlist(): BelongsTo
    {
        return $this->belongsTo(Masterlist::class);
    }

    public function answers(): HasMany
    {
        return $this->hasMany(SurveyAnswer::class, 'response_id');
    }
}
