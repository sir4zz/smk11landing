<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ---------- KESEMAPTAAN (profile / hero / tentang / tujuan) ----------
        Schema::table('kesemaptaan', function (Blueprint $table) {
            $table->text('hero_title')->default('');
            $table->text('hero_description')->default('');
            $table->text('hero_image')->default('');
            $table->text('about_title')->default('');
            $table->text('about_description')->default('');
            $table->json('goals')->default('[]');
            $table->timestamp('created_at')->useCurrent();
        });

        // Backfill created_at for existing profile rows so ordering is stable.
        DB::table('kesemaptaan')->whereNull('created_at')->update(['created_at' => DB::raw('NOW()')]);

        // ---------- KESEMAPTAAN ACTIVITIES (cover photo per card) ----------
        Schema::table('kesemaptaan_activities', function (Blueprint $table) {
            $table->text('photo')->default('');
        });

        // ---------- KESEMAPTAAN SCHEDULES (name, date, location, description) ----------
        Schema::table('kesemaptaan_schedules', function (Blueprint $table) {
            $table->text('name')->default('');
            $table->date('date')->nullable();
            $table->text('location')->default('');
            $table->text('description')->default('');
        });

        // Migrate existing schedule rows into the new shape.
        DB::table('kesemaptaan_schedules')->get()->each(function ($row) {
            DB::table('kesemaptaan_schedules')->where('id', $row->id)->update([
                'name' => $row->day ?? '',
                'location' => $row->place ?? '',
                'description' => $row->time ?? '',
            ]);
        });

        Schema::table('kesemaptaan_schedules', function (Blueprint $table) {
            $table->dropColumn(['day', 'time', 'place']);
        });

        // ---------- KESEMAPTAAN GALLERY (dokumentasi foto) ----------
        Schema::create('kesemaptaan_gallery', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
            $table->text('image')->default('');
            $table->text('caption')->default('');
            $table->boolean('is_primary')->default(false);
            $table->integer('sort_order')->default(0);
            $table->timestamp('created_at')->useCurrent();
            $table->index('sort_order', 'kesemaptaan_gallery_sort_order_index');
        });

        // ---------- KESEMAPTAAN VIDEOS (YouTube only) ----------
        Schema::create('kesemaptaan_videos', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
            $table->text('youtube_url')->default('');
            $table->text('title')->default('');
            $table->integer('sort_order')->default(0);
            $table->timestamp('created_at')->useCurrent();
            $table->index('sort_order', 'kesemaptaan_videos_sort_order_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kesemaptaan_videos');
        Schema::dropIfExists('kesemaptaan_gallery');

        Schema::table('kesemaptaan_schedules', function (Blueprint $table) {
            $table->text('day')->default('');
            $table->text('time')->default('');
            $table->text('place')->default('');
        });

        DB::table('kesemaptaan_schedules')->get()->each(function ($row) {
            DB::table('kesemaptaan_schedules')->where('id', $row->id)->update([
                'day' => $row->name ?? '',
                'time' => $row->description ?? '',
                'place' => $row->location ?? '',
            ]);
        });

        Schema::table('kesemaptaan_schedules', function (Blueprint $table) {
            $table->dropColumn(['name', 'date', 'location', 'description']);
        });

        Schema::table('kesemaptaan_activities', function (Blueprint $table) {
            $table->dropColumn('photo');
        });

        Schema::table('kesemaptaan', function (Blueprint $table) {
            $table->dropColumn(['hero_title', 'hero_description', 'hero_image', 'about_title', 'about_description', 'goals', 'created_at']);
        });
    }
};