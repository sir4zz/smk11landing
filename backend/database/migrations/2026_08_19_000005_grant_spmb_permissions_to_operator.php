<?php

use App\Models\Permission;
use App\Models\Role;
use App\Models\RolePermission;
use Illuminate\Database\Migrations\Migration;

/**
 * Grant the SPMB module permissions to the operator_sekolah role so that
 * Admin AND Operator Sekolah can manage SPMB announcements (posters).
 * Admin implicitly has every permission via PermissionService.
 */
return new class extends Migration
{
    public function up(): void
    {
        $permissions = [
            ['spmb.view', 'SPMB - Lihat', 'spmb'],
            ['spmb.create', 'SPMB - Buat', 'spmb'],
            ['spmb.edit', 'SPMB - Ubah', 'spmb'],
            ['spmb.delete', 'SPMB - Hapus', 'spmb'],
        ];

        $ids = [];
        foreach ($permissions as [$slug, $name, $module]) {
            $perm = Permission::firstOrCreate(
                ['slug' => $slug],
                ['name' => $name, 'module' => $module, 'created_at' => now()]
            );
            $ids[$slug] = $perm->id;
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

        $admin = Role::query()->where('slug', 'admin')->first();
        if ($admin) {
            foreach ($ids as $permissionId) {
                RolePermission::firstOrCreate([
                    'role_id' => $admin->id,
                    'permission_id' => $permissionId,
                ]);
            }
        }
    }

    public function down(): void
    {
        RolePermission::query()->whereIn('permission_id', function ($q) {
            $q->select('id')->from('permissions')->whereIn('slug', ['spmb.view', 'spmb.create', 'spmb.edit', 'spmb.delete']);
        })->delete();
    }
};