<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\CommentResource;
use App\Models\Comment;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    public function index(Request $request)
    {
        $data = $request->validate([
            'commentable_type' => ['nullable', 'string'],
            'commentable_id' => ['nullable', 'integer'],
            'status' => ['nullable', 'in:pending,approved,rejected,spam'],
        ]);

        $query = Comment::with([
                'reactions',
                'commentable' => fn ($morphTo) => $morphTo->constrain([
                    \App\Models\Event::class        => fn ($q) => $q->withTrashed(),
                    \App\Models\Announcement::class => fn ($q) => $q->withTrashed(),
                    \App\Models\Survey::class       => fn ($q) => $q->withTrashed(),
                ]),
            ])
            ->when($data['commentable_type'] ?? null, fn ($q, $t) => $q->where('commentable_type', $t))
            ->when($data['commentable_id'] ?? null, fn ($q, $i) => $q->where('commentable_id', $i))
            ->when($data['status'] ?? null, fn ($q, $s) => $q->where('status', $s))
            ->orderByDesc('is_pinned')
            ->orderByDesc('created_at');

        return CommentResource::collection($query->limit(100)->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'commentable_type' => ['required', 'string'],
            'commentable_id' => ['required', 'integer'],
            'parent_id' => ['nullable', 'integer', 'exists:comments,id'],
            'author_name' => ['required', 'string', 'max:120'],
            'author_email' => ['nullable', 'email', 'max:255'],
            'body' => ['required', 'string', 'max:2000'],
        ]);

        // Basic spam heuristics
        $body = strip_tags($data['body']);
        $isSpam = preg_match('/https?:\/\/.{2,}\s+https?:\/\//i', $body)
            || str_word_count($body) < 2;

        $comment = Comment::create([
            ...$data,
            'body' => $body,
            'status' => $isSpam ? 'spam' : 'pending',
        ]);

        return new CommentResource($comment);
    }

    public function moderate(Request $request, Comment $comment)
    {
        $data = $request->validate([
            'status' => ['nullable', 'in:pending,approved,rejected,spam'],
            'is_pinned' => ['nullable', 'boolean'],
        ]);

        $comment->update($data);

        return new CommentResource($comment->load([
            'reactions',
            'commentable' => fn ($morphTo) => $morphTo->constrain([
                \App\Models\Event::class        => fn ($q) => $q->withTrashed(),
                \App\Models\Announcement::class => fn ($q) => $q->withTrashed(),
                \App\Models\Survey::class       => fn ($q) => $q->withTrashed(),
            ]),
        ]));
    }
}
