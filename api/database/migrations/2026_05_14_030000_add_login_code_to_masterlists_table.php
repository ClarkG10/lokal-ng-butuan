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
        // Uses PHP to avoid LPAD(bigint) incompatibility between MySQL and PostgreSQL.
        DB::table('masterlists')->whereNull('login_code')->orderBy('id')->chunkById(500, function ($rows) {
            foreach ($rows as $row) {
                $initials = strtoupper(substr((string) $row->first_name, 0, 1))
                    . strtoupper(substr((string) ($row->middle_name ?? ''), 0, 1))
                    . strtoupper(substr((string) $row->last_name, 0, 1));
                DB::table('masterlists')->where('id', $row->id)->update([
                    'login_code' => $initials . str_pad((string) $row->id, 6, '0', STR_PAD_LEFT),
                ]);
            }
        });
    }

    public function down(): void
    {
        Schema::table('masterlists', function (Blueprint $table) {
            $table->dropColumn(['login_code', 'birthdate']);
        });
    }
};
