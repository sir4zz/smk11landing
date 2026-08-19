<?php

use App\Models\Permission;
use App\Models\Role;
use App\Models\RolePermission;
use Illuminate\Database\Migrations\Migration;

/**
 * SDM (Sumber Daya Manusia) permissions.
 *
 * Admin implicitly has every permission (PermissionService special-case), but
 * the explicit role_permissions rows keep the RBAC table consistent. Operator
 * Sekolah is the day-to-day SDM manager and receives the full SDM module.
 */
return new class extends Migration
{
    public function up(): void
    {
        $permissions = [
            ['sdm.view', 'SDM - Lihat', 'sdm'],
            ['sdm.create', 'SDM - Buat', 'sdm'],
            ['sdm.edit', 'SDM - Ubah', 'sdm'],
            ['sdm.delete', 'SDM - Hapus', 'sdm'],
            ['sdm.import', 'SDM - Import Data', 'sdm'],
            ['sdm.export', 'SDM - Export Data', 'sdm'],
        ];

        $ids = [];
        foreach ($permissions as [$slug, $name, $module]) {
            $perm = Permission::firstOrCreate(
                ['slug' => $slug],
                ['name' => $name, 'module' => $module, 'created_at' => now()]
            );
            $ids[$slug] = $perm->id;
        }

        $admin = Role::query()->where('slug', 'admin')->first();
        if ($admin) {
            foreach ($ids as $permissionId) {
                RolePermission::firstOrCreate([
                    'role_id' => $admin->id,
                    'permission_id' => $permissionId,
                ]);
            }
        }

        $operator = Role::query()->where('slug', 'operator_sekolah')->first();
        if ($operator) {
            foreach ($ids as $permissionId) {
                RolePermission::firstOrCreate([
                    'role_id' => $operator->id,
                    'permission_id' => $permissionId,
                ]);
            }
        }
    }

    public function down(): void
    {
        foreach (['sdm.view', 'sdm.create', 'sdm.edit', 'sdm.delete', 'sdm.import', 'sdm.export'] as $slug) {
            Permission::query()->where('slug', $slug)->delete();
        }
    }
};