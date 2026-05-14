<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('masterlists', function (Blueprint $table) {
            $table->string('login_code', 16)->nullable()->unique()->after('phone');
            $table->date('birthdate')->nullable()->after('login_code');
        });

        // Back-fill codes for existing rows: INITIALS + ID padded to 6 digits
        DB::statement("
            UPDATE masterlists
            SET login_code = CONCAT(
                UPPER(LEFT(first_name, 1)),
                UPPER(LEFT(COALESCE(middle_name, ''), 1)),
                UPPER(LEFT(last_name, 1)),
                LPAD(id, 6, '0')
            )
            WHERE login_code IS NULL
        ");
    }

    public function down(): void
    {
        Schema::table('masterlists', function (Blueprint $table) {
            $table->dropColumn(['login_code', 'birthdate']);
        });
    }
};
