<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Guru data change requests: official identity/employment fields of an
 * imported guru (sdm_gurus) may only be changed by the operator, so the guru
 * submits a request that is verified before being applied.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('guru_data_change_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('guru_id')->references('id')->on('sdm_gurus')->onDelete('cascade');
            $table->json('old_data')->default('{}');
            $table->json('proposed_data')->default('{}');
            $table->text('status')->default('menunggu');
            $table->text('rejection_reason')->nullable();
            $table->foreignUuid('verified_by')->nullable()->references('id')->on('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('guru_data_change_requests');
    }
};
