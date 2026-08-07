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
        // Drop the previous single-video column (idempotent).
        if (Schema::hasColumn('galleries', 'video_url')) {
            Schema::table('galleries', function (Blueprint $table) {
                $table->dropColumn('video_url');
            });
        }

        Schema::create('gallery_videos', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
            $table->foreignUuid('gallery_id')->references('id')->on('galleries')->onDelete('cascade');
            $table->text('youtube_url')->default('');
            $table->text('title')->default('');
            $table->integer('sort_order')->default(0);
            $table->timestamp('created_at')->useCurrent();

            $table->index('gallery_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gallery_videos');
        if (! Schema::hasColumn('galleries', 'video_url')) {
            Schema::table('galleries', function (Blueprint $table) {
                $table->text('video_url')->default('');
            });
        }
    }
};