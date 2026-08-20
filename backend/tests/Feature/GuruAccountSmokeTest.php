<?php

namespace Tests\Feature;

use App\Models\GuruDataChangeRequest;
use App\Models\Permission;
use App\Models\Profile;
use App\Models\Role;
use App\Models\RolePermission;
use App\Models\SdmGuru;
use App\Models\User;
use App\Services\PermissionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class GuruAccountSmokeTest extends TestCase
{
    use RefreshDatabase;

    public function test_guru_account_flow_over_http(): void
    {
        $guru = SdmGuru::create([
            'name' => 'TEST GURU SMOKE',
            'nip' => '199999999999999999',
            'nuptk' => null,
            'email' => 'smoke.test.guru@gmail.com',
            'phone' => '081111111111',
            'address' => 'Jl. Uji Coba No. 1',
            'jabatan' => 'GURU MADYA',
            'status_kepegawaian' => 'PNS',
            'is_active' => true,
        ]);

        $operator = $this->staff('operator_sekolah', ['sdm.view', 'sdm.edit']);

        $this->assertTrue(app(PermissionService::class)->hasPermission($operator, 'sdm.edit'));

        // 1. Operator reads account summary (should be unlinked)
        $this->actingAs($operator, 'sanctum')
            ->getJson('/api/admin/sdm/guru/'.$guru->id.'/account')
            ->assertOk()
            ->assertJson(['data' => ['linked' => false]]);

        // 2. Operator creates the account
        $created = $this->actingAs($operator, 'sanctum')
            ->postJson('/api/admin/sdm/guru/'.$guru->id.'/account', ['email' => 'smoke.test.guru@gmail.com'])
            ->assertCreated()
            ->assertJsonPath('data.account.linked', true)
            ->assertJsonPath('data.account.user.email', 'smoke.test.guru@gmail.com')
            ->assertJsonStructure(['data' => ['account' => ['user' => ['id']], 'generated_password']]);

        $password = $created->json('data.generated_password');
        $this->assertNotNull($password);

        $guru->refresh();
        $user = $guru->user;
        $this->assertNotNull($user);

        // 3. Guru reads own data
        $this->actingAs($user, 'sanctum')
            ->getJson('/api/guru/data-saya')
            ->assertOk()
            ->assertJsonPath('data.name', 'TEST GURU SMOKE')
            ->assertJsonPath('data.jabatan', 'GURU MADYA');

        // 4. Guru submits a change request
        $this->actingAs($user, 'sanctum')
            ->postJson('/api/guru/data-saya/change-requests', ['proposed_data' => ['jabatan' => 'KEPALA SEKOLAH']])
            ->assertStatus(201)
            ->assertJsonPath('data.status', 'menunggu');

        // 5. Guru lists own requests
        $this->actingAs($user, 'sanctum')
            ->getJson('/api/guru/data-saya/change-requests')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        // 6. Operator lists admin requests
        $this->actingAs($operator, 'sanctum')
            ->getJson('/api/admin/guru-change-requests')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $requestRow = GuruDataChangeRequest::where('guru_id', $guru->id)->firstOrFail();

        // 7. Operator verifies (approve)
        $this->actingAs($operator, 'sanctum')
            ->patchJson('/api/admin/guru-change-requests/'.$requestRow->id.'/verify', ['status' => 'disetujui'])
            ->assertOk()
            ->assertJsonPath('data.status', 'disetujui');

        $guru->refresh();
        $this->assertSame('KEPALA SEKOLAH', $guru->jabatan);

        // 8. Operator disables, then re-enables the account
        $this->actingAs($operator, 'sanctum')
            ->patchJson('/api/admin/sdm/guru/'.$guru->id.'/account', ['status' => 'inactive'])
            ->assertOk()
            ->assertJsonPath('data.user.status', 'inactive');

        // 9. Disabled account cannot log in (login blocked for inactive)
        $this->postJson('/api/auth/login', ['identifier' => $guru->nip, 'password' => $password])
            ->assertStatus(403);

        $this->actingAs($operator, 'sanctum')
            ->patchJson('/api/admin/sdm/guru/'.$guru->id.'/account', ['status' => 'active'])
            ->assertOk()
            ->assertJsonPath('data.user.status', 'active');

        // 10. Guru cancels nothing; operator unlinks the account
        $this->actingAs($operator, 'sanctum')
            ->deleteJson('/api/admin/sdm/guru/'.$guru->id.'/account')
            ->assertOk();

        $guru->refresh();
        $this->assertNull($guru->user_id);
        $this->assertDatabaseMissing('users', ['id' => $user->id]);
    }

    private function staff(string $roleSlug, array $permissionSlugs): User
    {
        $user = User::create([
            'email' => str_replace('_', '-', $roleSlug).'@example.test',
            'password' => Hash::make('secret123'),
            'name' => ucfirst($roleSlug),
        ]);
        Profile::create(['id' => $user->id, 'role' => $roleSlug, 'name' => $user->name, 'email' => $user->email, 'status' => 'active']);

        $role = Role::firstOrCreate(['slug' => $roleSlug], ['name' => $roleSlug, 'created_at' => now()]);
        $permissions = collect($permissionSlugs)->map(
            fn (string $slug) => Permission::firstOrCreate(['slug' => $slug], ['name' => $slug, 'module' => 'sdm', 'created_at' => now()])
        );
        foreach ($permissions as $permission) {
            RolePermission::create(['role_id' => $role->id, 'permission_id' => $permission->id]);
        }

        return $user->fresh(['profileRecord']);
    }
}