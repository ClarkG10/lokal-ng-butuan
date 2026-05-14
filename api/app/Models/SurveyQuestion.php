<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SurveyQuestion extends Model
{
    protected $fillable = [
        'survey_id', 'step', 'sort_order', 'type', 'label',
        'help_text', 'options', 'is_required', 'visibility_rules',
    ];

    protected $casts = [
        'options' => 'array',
        'visibility_rules' => 'array',
        'is_required' => 'boolean',
    ];

    public function survey(): BelongsTo
    {
        return $this->belongsTo(Survey::class);
    }
}
