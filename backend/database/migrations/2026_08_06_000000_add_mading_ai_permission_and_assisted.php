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
        $permissionId = DB::table('permissions')->where('slug', 'mading.ai_generate')->value('id');

        if (! $permissionId) {
            $permissionId = (string) Str::uuid();
            DB::table('permissions')->insert([
                'id' => $permissionId,
                'slug' => 'mading.ai_generate',
                'name' => 'Mading - AI Content Assistant',
                'module' => 'mading',
                'created_at' => now(),
            ]);
        }

        foreach (['guru', 'osis'] as $roleSlug) {
            $roleId = DB::table('roles')->where('slug', $roleSlug)->value('id');
            if (! $roleId) {
                continue;
            }
            DB::table('role_permissions')->updateOrInsert([
                'role_id' => $roleId,
                'permission_id' => $permissionId,
            ], []);
        }

        if (! Schema::hasColumn('mading_posts', 'ai_assisted')) {
            Schema::table('mading_posts', function (Blueprint $table) {
                $table->boolean('ai_assisted')->default(false);
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('mading_posts', 'ai_assisted')) {
            Schema::table('mading_posts', function (Blueprint $table) {
                $table->dropColumn('ai_assisted');
            });
        }

        $permissionId = DB::table('permissions')->where('slug', 'mading.ai_generate')->value('id');
        if ($permissionId) {
            DB::table('role_permissions')->where('permission_id', $permissionId)->delete();
            DB::table('permissions')->where('id', $permissionId)->delete();
        }
    }
};
