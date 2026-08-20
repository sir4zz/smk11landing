<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

/**
 * Guarantees at most one login account is linked per imported guru record,
 * so a guru can never be duplicated into the account system.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sdm_gurus', function ($table) {
            $table->unique('user_id');
        });
    }

    public function down(): void
    {
        Schema::table('sdm_gurus', function ($table) {
            $table->dropUnique('sdm_gurus_user_id_unique');
        });
    }
};
