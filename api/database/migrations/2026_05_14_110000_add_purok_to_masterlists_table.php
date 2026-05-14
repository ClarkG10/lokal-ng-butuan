<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('masterlists', function (Blueprint $table) {
            $table->string('purok', 120)->nullable()->after('belongs_to');
        });
    }

    public function down(): void
    {
        Schema::table('masterlists', function (Blueprint $table) {
            $table->dropColumn('purok');
        });
    }
};
