<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

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
            $table->index('sort_order', 'mading_categories_sort_order_index');
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
            $table->boolean('ai_assisted')->default(false);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->index('author_id');
            $table->index('status');
            $table->index('category_id');
            $table->index(['status', 'published_at'], 'mading_posts_status_published_at_index');
            $table->index(['author_id', 'status', 'published_at'], 'mading_posts_author_status_published_at_index');
            $table->index(['category_id', 'status', 'published_at'], 'mading_posts_category_status_published_at_index');
        });

        $permissionId = (string) Str::uuid();
        DB::table('permissions')->insert([
            'id' => $permissionId,
            'slug' => 'mading.ai_generate',
            'name' => 'Mading - AI Content Assistant',
            'module' => 'mading',
            'created_at' => now(),
        ]);
        foreach (['guru', 'osis'] as $roleSlug) {
            $roleId = DB::table('roles')->where('slug', $roleSlug)->value('id');
            if ($roleId) {
                DB::table('role_permissions')->insertOrIgnore([
                    'role_id' => $roleId,
                    'permission_id' => $permissionId,
                ]);
            }
        }

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
