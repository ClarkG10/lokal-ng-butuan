<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('masterlists', function (Blueprint $table) {
            $table->id();
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');
            $table->enum('belongs_to', ['Binhi', 'Kadiwa', 'Buklod'])->index();
            $table->string('email')->nullable()->index();
            $table->string('phone', 32)->nullable()->index();
            $table->json('tags')->nullable();
            $table->timestamp('first_seen_at')->nullable();
            $table->timestamp('last_activity_at')->nullable()->index();
            $table->unsignedInteger('events_count')->default(0);
            $table->unsignedInteger('surveys_count')->default(0);
            $table->string('source', 64)->nullable();
            $table->timestamps();
            $table->index(['last_name', 'first_name']);
        });

        Schema::create('surveys', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('title');
            $table->longText('description')->nullable();
            $table->enum('status', ['draft', 'active', 'closed'])->default('draft')->index();
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->foreignId('qr_code_id')->nullable()->constrained('qr_codes')->nullOnDelete();
            $table->json('settings')->nullable();
            $table->timestamps();
        });

        Schema::create('survey_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('survey_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('step')->default(1);
            $table->unsignedInteger('sort_order')->default(0);
            $table->enum('type', [
                'short_text', 'long_text', 'single_choice', 'multi_choice',
                'rating', 'email', 'phone', 'consent',
            ]);
            $table->string('label');
            $table->string('help_text')->nullable();
            $table->json('options')->nullable();
            $table->boolean('is_required')->default(false);
            $table->json('visibility_rules')->nullable();
            $table->timestamps();
            $table->index(['survey_id', 'step', 'sort_order']);
        });

        Schema::create('survey_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('survey_id')->constrained()->cascadeOnDelete();
            $table->foreignId('masterlist_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamp('submitted_at')->index();
            $table->string('ip_hash', 64)->nullable();
            $table->string('user_agent', 512)->nullable();
            $table->boolean('via_qr')->default(false);
        });

        Schema::create('survey_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('response_id')->constrained('survey_responses')->cascadeOnDelete();
            $table->foreignId('question_id')->constrained('survey_questions')->cascadeOnDelete();
            $table->json('value');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('survey_answers');
        Schema::dropIfExists('survey_responses');
        Schema::dropIfExists('survey_questions');
        Schema::dropIfExists('surveys');
        Schema::dropIfExists('masterlists');
    }
};
