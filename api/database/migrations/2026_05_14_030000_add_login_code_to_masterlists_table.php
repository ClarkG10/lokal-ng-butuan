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
                // Split first_name by spaces so "Brixton Josh" → initials B+J
                $fnWords  = array_filter(preg_split('/\s+/', trim((string) $row->first_name)));
                $fnInits  = implode('', array_map(fn ($w) => strtoupper($w[0]), $fnWords));
                $mnInit   = !empty($row->middle_name) ? strtoupper($row->middle_name[0]) : '';
                $lnInit   = strtoupper(((string) $row->last_name)[0]);
                $initials = $fnInits . $mnInit . $lnInit;

                $suffix = $row->birthdate
                    ? date('mdy', strtotime($row->birthdate))
                    : str_pad((string) $row->id, 6, '0', STR_PAD_LEFT);

                DB::table('masterlists')->where('id', $row->id)->update([
                    'login_code' => $initials . $suffix,
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
