<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Reaction;
use Illuminate\Http\Request;

class ReactionController extends Controller
{
    public function toggle(Request $request, Comment $comment)
    {
        $data = $request->validate([
            'type' => ['required', 'in:like,love,pray,amen'],
        ]);

        $hash = hash('sha256', $request->ip() . '|' . $request->userAgent() . '|' . config('app.key'));

        $existing = Reaction::where('comment_id', $comment->id)
            ->where('type', $data['type'])
            ->where('identifier_hash', $hash)
            ->first();

        if ($existing) {
            $existing->delete();

            return response()->json(['data' => ['active' => false]]);
        }

        Reaction::create([
            'comment_id' => $comment->id,
            'type' => $data['type'],
            'identifier_hash' => $hash,
        ]);

        return response()->json(['data' => ['active' => true]]);
    }
}
