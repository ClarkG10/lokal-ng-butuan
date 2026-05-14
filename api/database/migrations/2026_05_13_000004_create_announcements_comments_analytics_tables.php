<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('announcement_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->timestamps();
        });

        Schema::create('announcements', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('title');
            $table->string('excerpt', 512)->nullable();
            $table->longText('body_rich')->nullable();
            $table->string('cover_path')->nullable();
            $table->foreignId('category_id')->nullable()
                  ->constrained('announcement_categories')->nullOnDelete();
            $table->enum('status', ['draft', 'published'])->default('draft')->index();
            $table->timestamp('published_at')->nullable()->index();
            $table->foreignId('author_id')->nullable()->constrained('users')->nullOnDelete();
            $table->json('meta')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('comments', function (Blueprint $table) {
            $table->id();
            $table->morphs('commentable');
            $table->foreignId('parent_id')->nullable()
                  ->constrained('comments')->cascadeOnDelete();
            $table->string('author_name')->nullable();
            $table->string('author_email')->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('body');
            $table->enum('status', ['pending', 'approved', 'rejected', 'spam'])
                  ->default('approved')->index();
            $table->boolean('is_pinned')->default(false);
            $table->timestamps();
        });

        Schema::create('reactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('comment_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['like', 'love', 'pray', 'amen']);
            $table->string('identifier_hash', 64); // hashed (ip + ua) or user_id
            $table->timestamps();
            $table->unique(['comment_id', 'type', 'identifier_hash']);
        });

        Schema::create('analytics_logs', function (Blueprint $table) {
            $table->id();
            $table->string('event_type', 64)->index();
            $table->string('subject_type')->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->json('meta')->nullable();
            $table->timestamp('occurred_at')->index();
            $table->index(['subject_type', 'subject_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('analytics_logs');
        Schema::dropIfExists('reactions');
        Schema::dropIfExists('comments');
        Schema::dropIfExists('announcements');
        Schema::dropIfExists('announcement_categories');
    }
};
