<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('qr_codes', function (Blueprint $table) {
            $table->id();
            $table->string('token', 32)->unique();
            $table->string('target_type');     // App\Models\Event | App\Models\Survey
            $table->unsignedBigInteger('target_id');
            $table->unsignedInteger('scan_count')->default(0);
            $table->timestamps();
            $table->index(['target_type', 'target_id']);
        });

        Schema::create('qr_scans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('qr_code_id')->constrained('qr_codes')->cascadeOnDelete();
            $table->timestamp('scanned_at')->index();
            $table->string('ip_hash', 64)->nullable();
            $table->string('user_agent', 512)->nullable();
            $table->string('referrer', 512)->nullable();
        });

        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('title');
            $table->longText('description')->nullable();
            $table->timestamp('starts_at')->index();
            $table->timestamp('ends_at')->index();
            $table->string('location')->nullable();
            $table->string('address')->nullable();
            $table->decimal('lat', 10, 7)->nullable();
            $table->decimal('lng', 10, 7)->nullable();
            $table->enum('status', ['upcoming', 'ongoing', 'completed', 'cancelled'])
                  ->default('upcoming')->index();
            $table->unsignedInteger('capacity')->nullable();
            $table->boolean('requires_registration')->default(false);
            $table->foreignId('cover_media_id')->nullable();
            $table->foreignId('qr_code_id')->nullable()->constrained('qr_codes')->nullOnDelete();
            $table->timestamp('published_at')->nullable()->index();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['status', 'starts_at']);
        });

        Schema::create('event_media', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->string('path');
            $table->enum('orientation', ['landscape', 'portrait']);
            $table->boolean('is_cover')->default(false);
            $table->unsignedInteger('sort_order')->default(0);
            $table->string('alt_text')->nullable();
            $table->timestamps();
            $table->index(['event_id', 'sort_order']);
        });

        // Add deferred FK for cover_media_id now that event_media exists
        Schema::table('events', function (Blueprint $table) {
            $table->foreign('cover_media_id')
                  ->references('id')->on('event_media')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropForeign(['cover_media_id']);
        });
        Schema::dropIfExists('event_media');
        Schema::dropIfExists('events');
        Schema::dropIfExists('qr_scans');
        Schema::dropIfExists('qr_codes');
    }
};
