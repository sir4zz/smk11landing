<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mading_categories', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
            $table->string('slug', 100)->unique();
            $table->string('name', 150);
            $table->integer('sort_order')->default(0);
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('mading_posts', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
            $table->text('title')->default('');
            $table->text('content')->default('');
            $table->foreignUuid('category_id')->nullable()->references('id')->on('mading_categories')->onDelete('set null');
            $table->foreignUuid('author_id')->nullable()->references('id')->on('users')->onDelete('set null');
            $table->text('author_name')->default('');
            $table->string('author_role', 30)->default('siswa');
            $table->text('cover_image')->default('');
            $table->string('status', 30)->default('draft');
            $table->text('feedback')->default('');
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->index('author_id');
            $table->index('status');
            $table->index('category_id');
        });

        Schema::create('mading_reviews', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
            $table->foreignUuid('post_id')->references('id')->on('mading_posts')->onDelete('cascade');
            $table->foreignUuid('reviewer_id')->nullable()->references('id')->on('users')->onDelete('set null');
            $table->text('reviewer_name')->default('');
            $table->string('action', 30)->default('approve');
            $table->text('feedback')->default('');
            $table->timestamp('created_at')->useCurrent();

            $table->index('post_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mading_reviews');
        Schema::dropIfExists('mading_posts');
        Schema::dropIfExists('mading_categories');
    }
};
