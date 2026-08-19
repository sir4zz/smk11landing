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
        Schema::create('job_vacancies', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
            $table->text('company_name')->default('');
            $table->text('company_logo')->default('');
            $table->text('position')->default('');
            $table->text('slug')->unique();
            $table->text('company_description')->default('');
            $table->text('job_description')->default('');
            $table->text('responsibilities')->default('');
            $table->text('requirements')->default('');
            $table->text('benefits')->default('');
            $table->text('education')->default('');
            $table->text('experience')->default('');
            $table->text('major')->default('');
            $table->text('city')->default('');
            $table->text('location')->default('');
            $table->enum('employment_type', ['full_time', 'contract', 'internship'])->default('full_time');
            $table->text('registration_link')->default('');
            $table->text('hr_contact')->default('');
            $table->date('deadline')->nullable();
            $table->enum('status', ['open', 'closing', 'closed'])->default('open');
            $table->boolean('is_published')->default(false);
            $table->timestamps();

            $table->index('is_published');
            $table->index('status');
            $table->index('city');
            $table->index('major');
            $table->index('employment_type');
            $table->index('deadline');
            $table->index(['is_published', 'status', 'deadline', 'created_at'], 'jobs_public_listing_index');
        });

        $permissions = [
            ['job.view', 'BKK - Lihat', 'bkk'],
            ['job.create', 'BKK - Buat', 'bkk'],
            ['job.edit', 'BKK - Ubah', 'bkk'],
            ['job.delete', 'BKK - Hapus', 'bkk'],
            ['job.publish', 'BKK - Publikasi', 'bkk'],
        ];

        $permissionIds = [];
        foreach ($permissions as [$slug, $name, $module]) {
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

        $adminId = DB::table('roles')->where('slug', 'admin')->value('id');
        if ($adminId) {
            foreach ($permissionIds as $permissionId) {
                DB::table('role_permissions')->updateOrInsert([
                    'role_id' => $adminId,
                    'permission_id' => $permissionId,
                ], []);
            }
        }

        foreach (['guru', 'osis'] as $roleSlug) {
            $roleId = DB::table('roles')->where('slug', $roleSlug)->value('id');
            if (! $roleId) {
                continue;
            }
            foreach (['job.view', 'job.create', 'job.edit', 'job.publish'] as $slug) {
                DB::table('role_permissions')->updateOrInsert([
                    'role_id' => $roleId,
                    'permission_id' => $permissionIds[$slug],
                ], []);
            }
        }
    }

    public function down(): void
    {
        $slugs = ['job.view', 'job.create', 'job.edit', 'job.delete', 'job.publish'];
        $ids = DB::table('permissions')->whereIn('slug', $slugs)->pluck('id');
        if ($ids->isNotEmpty()) {
            DB::table('role_permissions')->whereIn('permission_id', $ids)->delete();
            DB::table('permissions')->whereIn('id', $ids)->delete();
        }

        Schema::dropIfExists('job_vacancies');
    }
};
