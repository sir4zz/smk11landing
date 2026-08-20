<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Extend the existing spmb_posters table with announcement fields:
 * published_at (scheduled publication), is_featured (single main/featured
 * announcement) and created_by (audit trail). No new table is introduced.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('spmb_posters', function (Blueprint $table) {
            $table->timestamp('published_at')->nullable()->after('is_active');
            $table->boolean('is_featured')->default(false)->after('published_at');
            $table->uuid('created_by')->nullable()->after('is_featured');
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('spmb_posters', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
            $table->dropColumn(['published_at', 'is_featured', 'created_by']);
        });
    }
};