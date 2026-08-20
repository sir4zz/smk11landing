<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Profile;
use App\Models\Role;
use App\Models\RolePermission;
use App\Models\SpmbPoster;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SpmbPosterTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_posters_only_returns_active_and_published(): void
    {
        $featured = SpmbPoster::create([
            'title' => 'Hasil Seleksi',
            'image' => '/storage/spmb/posters/featured.webp',
            'is_active' => true,
            'sort_order' => 1,
            'is_featured' => true,
            'published_at' => now()->subDay(),
        ]);
        SpmbPoster::create([
            'title' => 'Jadwal Daftar Ulang',
            'image' => '/storage/spmb/posters/jadwal.webp',
            'is_active' => true,
            'sort_order' => 2,
            'published_at' => null,
        ]);
        SpmbPoster::create([
            'title' => 'Rahasia Mendatang',
            'image' => '/storage/spmb/posters/scheduled.webp',
            'is_active' => true,
            'sort_order' => 3,
            'published_at' => now()->addDay(),
        ]);
        SpmbPoster::create([
            'title' => 'Nonaktif',
            'image' => '/storage/spmb/posters/inactive.webp',
            'is_active' => false,
            'sort_order' => 4,
            'published_at' => now()->subDay(),
        ]);

        $response = $this->getJson('/api/spmb/posters')->assertOk();

        $this->assertCount(2, $response->json('data'));
        $this->assertSame('Hasil Seleksi', $response->json('data.0.title'));
        $this->assertTrue($response->json('data.0.is_featured'));
        $this->assertSame('Jadwal Daftar Ulang', $response->json('data.1.title'));
    }

    public function test_only_one_featured_announcement_at_a_time(): void
    {
        $a = SpmbPoster::create(['title' => 'A', 'image' => '/storage/a.webp', 'is_active' => true]);
        $b = SpmbPoster::create(['title' => 'B', 'image' => '/storage/b.webp', 'is_active' => true]);

        $operator = $this->staff('operator_sekolah', ['spmb.view', 'spmb.edit']);

        $this->actingAs($operator, 'sanctum')
            ->patchJson('/api/admin/spmb/posters/'.$a->id, ['is_featured' => true])
            ->assertOk();
        $this->actingAs($operator, 'sanctum')
            ->patchJson('/api/admin/spmb/posters/'.$b->id, ['is_featured' => true])
            ->assertOk();

        $this->assertSame(1, SpmbPoster::where('is_featured', true)->count());
        $this->assertTrue(SpmbPoster::find($b->id)->is_featured);
        $this->assertFalse(SpmbPoster::find($a->id)->is_featured);
    }

    public function test_operator_sekolah_can_fully_manage_posters(): void
    {
        $operator = $this->staff('operator_sekolah', ['spmb.view', 'spmb.create', 'spmb.edit', 'spmb.delete']);

        // Create with new announcement fields
        $created = $this->actingAs($operator, 'sanctum')
            ->postJson('/api/admin/spmb/posters', [
                'title' => 'Pengumuman Resmi',
                'image' => '/storage/spmb/posters/resmi.webp',
                'is_active' => true,
                'sort_order' => 0,
                'published_at' => '2026-08-01',
                'is_featured' => true,
            ])
            ->assertCreated()
            ->assertJsonPath('data.created_by', $operator->id);

        $id = $created->json('data.id');

        // Update title + schedule
        $this->actingAs($operator, 'sanctum')
            ->patchJson('/api/admin/spmb/posters/'.$id, [
                'title' => 'Pengumuman Resmi (Revisi)',
                'published_at' => '2026-08-15',
                'is_active' => false,
            ])
            ->assertOk()
            ->assertJsonPath('data.title', 'Pengumuman Resmi (Revisi)');

        // Admin listing shows all (including inactive)
        $this->actingAs($operator, 'sanctum')
            ->getJson('/api/admin/spmb/posters')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.is_active', false)
            ->assertJsonPath('data.0.created_by', $operator->id);

        // Delete
        $this->actingAs($operator, 'sanctum')
            ->deleteJson('/api/admin/spmb/posters/'.$id)
            ->assertOk();
        $this->assertDatabaseMissing('spmb_posters', ['id' => $id]);
    }

    public function test_guru_without_spmb_permissions_cannot_write(): void
    {
        $guru = $this->staff('guru', ['spmb.view']);
        $poster = SpmbPoster::create(['title' => 'X', 'image' => '/storage/x.webp', 'is_active' => true]);

        $this->actingAs($guru, 'sanctum')->getJson('/api/admin/spmb/posters')->assertOk();
        $this->actingAs($guru, 'sanctum')->postJson('/api/admin/spmb/posters', ['title' => 'Y', 'image' => '/storage/y.webp'])->assertStatus(403);
        $this->actingAs($guru, 'sanctum')->patchJson('/api/admin/spmb/posters/'.$poster->id, ['title' => 'Z'])->assertStatus(403);
        $this->actingAs($guru, 'sanctum')->deleteJson('/api/admin/spmb/posters/'.$poster->id)->assertStatus(403);
        $this->actingAs($guru, 'sanctum')->postJson('/api/admin/spmb/posters/upload', ['file' => UploadedFile::fake()->image('x.png')])->assertStatus(403);
    }

    public function test_upload_accepts_images_only_and_stores_reference(): void
    {
        Storage::fake('public');
        $operator = $this->staff('operator_sekolah', ['spmb.edit']);

        $this->actingAs($operator, 'sanctum')
            ->postJson('/api/admin/spmb/posters/upload', ['file' => UploadedFile::fake()->create('evil.exe', 10)])
            ->assertStatus(422);

        $url = $this->actingAs($operator, 'sanctum')
            ->postJson('/api/admin/spmb/posters/upload', ['file' => UploadedFile::fake()->image('poster.png', 600, 800)])
            ->assertOk()
            ->json('data.url');
        $this->assertStringStartsWith('/storage/spmb/posters/', $url);
        $this->assertTrue(Storage::disk('public')->exists(str_replace('/storage/', '', $url)));
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
            fn (string $slug) => Permission::firstOrCreate(['slug' => $slug], ['name' => $slug, 'module' => 'spmb', 'created_at' => now()])
        );
        foreach ($permissions as $permission) {
            RolePermission::create(['role_id' => $role->id, 'permission_id' => $permission->id]);
        }

        return $user->fresh(['profileRecord']);
    }
}