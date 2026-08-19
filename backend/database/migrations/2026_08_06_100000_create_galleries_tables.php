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
        Schema::create('galleries', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
            $table->text('title')->default('');
            $table->text('slug')->unique();
            $table->text('description')->default('');
            $table->enum('category', ['Akademik', 'Kegiatan', 'Olahraga', 'Seni', 'Keagamaan', 'Lomba', 'Prestasi', 'Lainnya'])->default('Kegiatan');
            $table->date('event_date')->nullable();
            $table->text('location')->default('');
            $table->text('cover_image')->default('');
            $table->boolean('is_published')->default(false);
            $table->timestamps();

            $table->index('is_published');
            $table->index('event_date');
            $table->index('category');
            $table->index(['is_published', 'event_date', 'created_at'], 'galleries_public_listing_index');
        });

        Schema::create('gallery_images', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
            $table->foreignUuid('gallery_id')->references('id')->on('galleries')->onDelete('cascade');
            $table->text('image')->default('');
            $table->text('caption')->default('');
            $table->integer('sort_order')->default(0);
            $table->timestamp('created_at')->useCurrent();

            $table->index('gallery_id');
        });

        Schema::create('gallery_videos', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
            $table->foreignUuid('gallery_id')->references('id')->on('galleries')->onDelete('cascade');
            $table->text('youtube_url')->default('');
            $table->text('title')->default('');
            $table->integer('sort_order')->default(0);
            $table->timestamp('created_at')->useCurrent();
            $table->index('gallery_id');
        });

        $galleryPermissions = [
            ['gallery.view', 'Galeri - Lihat', 'gallery'],
            ['gallery.create', 'Galeri - Buat', 'gallery'],
            ['gallery.edit', 'Galeri - Ubah', 'gallery'],
            ['gallery.delete', 'Galeri - Hapus', 'gallery'],
            ['gallery.publish', 'Galeri - Publikasi', 'gallery'],
        ];

        $permissionIds = [];
        foreach ($galleryPermissions as [$slug, $name, $module]) {
            $id = DB::table('permissions')->where('slug', $slug)->value('id');
            if (! $id) {
                $id = (string) Str::uuid();
                DB::table('permissions')->insert([
                    'id' => $id,
                    'slug' => $slug,
                    'name' => $name,
                    'module' => $module,
                    'created_at' => now(),
                ]);
            }
            $permissionIds[$slug] = $id;
        }

        // Admin = full access.
        $adminId = DB::table('roles')->where('slug', 'admin')->value('id');
        if ($adminId) {
            foreach ($permissionIds as $permissionId) {
                DB::table('role_permissions')->updateOrInsert([
                    'role_id' => $adminId,
                    'permission_id' => $permissionId,
                ], []);
            }
        }

        // Guru + OSIS: by default can manage galleries.
        foreach (['guru', 'osis'] as $roleSlug) {
            $roleId = DB::table('roles')->where('slug', $roleSlug)->value('id');
            if (! $roleId) {
                continue;
            }
            foreach (['gallery.view', 'gallery.create', 'gallery.edit', 'gallery.publish'] as $slug) {
                DB::table('role_permissions')->updateOrInsert([
                    'role_id' => $roleId,
                    'permission_id' => $permissionIds[$slug],
                ], []);
            }
        }
    }

    public function down(): void
    {
        $gallerySlugs = ['gallery.view', 'gallery.create', 'gallery.edit', 'gallery.delete', 'gallery.publish'];
        $ids = DB::table('permissions')->whereIn('slug', $gallerySlugs)->pluck('id');
        if ($ids->isNotEmpty()) {
            DB::table('role_permissions')->whereIn('permission_id', $ids)->delete();
            DB::table('permissions')->whereIn('id', $ids)->delete();
        }

        Schema::dropIfExists('gallery_videos');
        Schema::dropIfExists('gallery_images');
        Schema::dropIfExists('galleries');
    }
};
