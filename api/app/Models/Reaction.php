<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reaction extends Model
{
    protected $fillable = ['comment_id', 'type', 'identifier_hash'];

    public function comment(): BelongsTo
    {
        return $this->belongsTo(Comment::class);
    }
}
