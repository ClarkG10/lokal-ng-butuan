<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Masterlist extends Model
{
    protected $fillable = [
        'first_name', 'middle_name', 'last_name', 'belongs_to', 'purok',
        'email', 'phone', 'tags',
        'first_seen_at', 'last_activity_at',
        'events_count', 'surveys_count', 'source',
    ];

    public const AFFILIATIONS = ['Binhi', 'Kadiwa', 'Buklod'];

    public function getFullNameAttribute(): string
    {
        return trim(implode(' ', array_filter([
            $this->first_name, $this->middle_name, $this->last_name,
        ])));
    }

    protected $casts = [
        'tags' => 'array',
        'first_seen_at' => 'datetime',
        'last_activity_at' => 'datetime',
    ];
}
