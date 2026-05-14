<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('masterlists', function (Blueprint $table) {
            // "Grupo" = the small prayer group the member belongs to (free-form string)
            $table->string('grupo', 100)->nullable()->after('purok');
        });
    }

    public function down(): void
    {
        Schema::table('masterlists', function (Blueprint $table) {
            $table->dropColumn('grupo');
        });
    }
};
