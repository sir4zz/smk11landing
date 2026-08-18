<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Sosial media untuk SDM (guru & tendik) yang ditampilkan di profil publik.
 * Kolom menyimpan username atau URL; dipisah per platform.
 */
return new class extends Migration
{
    private const SOCIAL_COLUMNS = [
        'instagram', 'facebook', 'twitter', 'tiktok',
        'youtube', 'linkedin', 'website', 'github',
    ];

    public function up(): void
    {
        foreach (['sdm_gurus', 'sdm_tendiks'] as $table) {
            Schema::table($table, function (Blueprint $t) {
                foreach (self::SOCIAL_COLUMNS as $column) {
                    $t->string($column, 255)->default('')->after('email');
                }
            });
        }
    }

    public function down(): void
    {
        foreach (['sdm_gurus', 'sdm_tendiks'] as $table) {
            Schema::table($table, function (Blueprint $t) {
                foreach (self::SOCIAL_COLUMNS as $column) {
                    $t->dropColumn($column);
                }
            });
        }
    }
};