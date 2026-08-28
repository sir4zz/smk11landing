<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sops', function (Blueprint $table) {
            // Sop uses HasUuids, so application-generated IDs keep this portable to SQLite tests.
            $table->uuid('id')->primary();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description')->default('');
            $table->string('category')->default('Umum');
            // Legacy column retained for safe migration of old records. New SOPs never use it.
            $table->string('file_path')->nullable();
            $table->string('drive_url')->nullable();
            $table->string('drive_file_id')->nullable();
            $table->boolean('is_published')->default(false);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['is_published', 'sort_order']);
            $table->index('category');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sops');
    }
};
