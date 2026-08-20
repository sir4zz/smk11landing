<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Profile;
use App\Models\Role;
use App\Models\RolePermission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class RolePermissionUiFlowTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $operator;
    private Role $guruRole;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = $this->staff('admin', []);
        $this->operator = $this->staff('operator_sekolah', ['sdm.view']);
        $this->guruRole = Role::firstOrCreate(['slug' => 'guru'], ['name' => 'Guru', 'created_at' => now()]);
    }

    public function test_admin_can_manage_roles_permissions_via_data_endpoints(): void
    {
        Permission::firstOrCreate(['slug' => 'sdm.view'], ['name' => 'View', 'module' => 'sdm', 'created_at' => now()]);
        Permission::firstOrCreate(['slug' => 'sdm.edit'], ['name' => 'Edit', 'module' => 'sdm', 'created_at' => now()]);

        // Read roles + permissions (as used by the RolePermissions page)
        $this->actingAs($this->admin, 'sanctum')->getJson('/api/data/roles')->assertOk();
        $this->actingAs($this->admin, 'sanctum')->getJson('/api/data/permissions')->assertOk();

        $guruId = $this->guruRole->id;
        $viewId = Permission::where('slug', 'sdm.view')->value('id');

        // Read role_permissions for the role
        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/data/role_permissions?role_id='.$guruId)
            ->assertOk();

        // Save = delete existing + bulk insert
        $this->actingAs($this->admin, 'sanctum')
            ->deleteJson('/api/data/role_permissions?role_id='.$guruId)
            ->assertOk();
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/data/role_permissions', [
                ['role_id' => $guruId, 'permission_id' => $viewId],
            ])
            ->assertCreated();

        $this->assertSame(
            ['sdm.view'],
            app(\App\Services\PermissionService::class)->permissionsForRole('guru')
        );

        // Changes take effect immediately (no stale cache) — UI always deletes then re-inserts
        $this->actingAs($this->admin, 'sanctum')
            ->deleteJson('/api/data/role_permissions?role_id='.$guruId)
            ->assertOk();
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/data/role_permissions', [
                ['role_id' => $guruId, 'permission_id' => $viewId],
                ['role_id' => $guruId, 'permission_id' => Permission::where('slug', 'sdm.edit')->value('id')],
            ])
            ->assertCreated();
        $slugs = app(\App\Services\PermissionService::class)->permissionsForRole('guru');
        sort($slugs);
        $this->assertSame(['sdm.edit', 'sdm.view'], $slugs);
    }

    public function test_non_admin_cannot_write_role_permissions(): void
    {
        $viewId = Permission::firstOrCreate(['slug' => 'sdm.view'], ['name' => 'View', 'module' => 'sdm', 'created_at' => now()])->id;

        $this->actingAs($this->operator, 'sanctum')
            ->postJson('/api/data/role_permissions', [['role_id' => $this->guruRole->id, 'permission_id' => $viewId]])
            ->assertStatus(403);

        $this->actingAs($this->operator, 'sanctum')
            ->deleteJson('/api/data/role_permissions?role_id='.$this->guruRole->id)
            ->assertStatus(403);
    }

    public function test_staff_can_read_roles_and_permissions(): void
    {
        Permission::firstOrCreate(['slug' => 'sdm.view'], ['name' => 'View', 'module' => 'sdm', 'created_at' => now()]);
        $this->actingAs($this->operator, 'sanctum')->getJson('/api/data/roles')->assertOk();
        $this->actingAs($this->operator, 'sanctum')->getJson('/api/data/permissions')->assertOk();
        $this->actingAs($this->operator, 'sanctum')->getJson('/api/data/role_permissions?role_id='.$this->guruRole->id)->assertOk();
    }

    private function staff(string $roleSlug, array $permissionSlugs): User
    {
        $user = User::create([
            'email' => $roleSlug.'@example.test',
            'password' => Hash::make('secret123'),
            'name' => ucfirst($roleSlug),
        ]);
        Profile::create(['id' => $user->id, 'role' => $roleSlug, 'name' => $user->name, 'email' => $user->email, 'status' => 'active']);
        $role = Role::firstOrCreate(['slug' => $roleSlug], ['name' => $roleSlug, 'created_at' => now()]);
        $perms = collect($permissionSlugs)->map(
            fn (string $slug) => Permission::firstOrCreate(['slug' => $slug], ['name' => $slug, 'module' => 'sdm', 'created_at' => now()])
        );
        foreach ($perms as $permission) {
            RolePermission::create(['role_id' => $role->id, 'permission_id' => $permission->id]);
        }

        return $user->fresh(['profileRecord']);
    }
}