<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Profile;
use App\Models\Role;
use App\Models\RolePermission;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AddNewRolesSeeder extends Seeder
{
    use \Illuminate\Database\Console\Seeds\WithoutModelEvents;

    public function run(): void
    {
        $this->seedRoles();
        $this->seedPermissions();
        $this->seedAccounts();
    }

    protected function seedRoles(): void
    {
        $roles = [
            'operator_sekolah' => 'Operator Sekolah',
            'bkk' => 'BKK',
        ];

        foreach ($roles as $slug => $name) {
            Role::firstOrCreate(
                ['slug' => $slug],
                ['name' => $name, 'created_at' => now()]
            );
        }

        $this->command->info('Roles created: operator_sekolah, bkk');
    }

    protected function seedPermissions(): void
    {
        $allPerms = [
            'dashboard.view' => ['name' => 'Dashboard - Lihat', 'module' => 'dashboard'],
            'management.view' => ['name' => 'Manajemen - Lihat', 'module' => 'management'],
            'mading.edit_all' => ['name' => 'Mading - Ubah Semua Karya', 'module' => 'mading'],
            'gallery.view' => ['name' => 'Galeri - Lihat', 'module' => 'gallery'],
            'gallery.create' => ['name' => 'Galeri - Buat', 'module' => 'gallery'],
            'gallery.edit' => ['name' => 'Galeri - Ubah', 'module' => 'gallery'],
            'gallery.delete' => ['name' => 'Galeri - Hapus', 'module' => 'gallery'],
            'job.view' => ['name' => 'BKK - Lihat', 'module' => 'bkk'],
            'job.create' => ['name' => 'BKK - Buat', 'module' => 'bkk'],
            'job.edit' => ['name' => 'BKK - Ubah', 'module' => 'bkk'],
            'job.delete' => ['name' => 'BKK - Hapus', 'module' => 'bkk'],
            'job.publish' => ['name' => 'BKK - Publikasi', 'module' => 'bkk'],
            'kelulusan.view' => ['name' => 'Kelulusan Siswa - Lihat', 'module' => 'kelulusan'],
            'kelulusan.create' => ['name' => 'Kelulusan Siswa - Buat', 'module' => 'kelulusan'],
            'kelulusan.edit' => ['name' => 'Kelulusan Siswa - Ubah', 'module' => 'kelulusan'],
            'kelulusan.delete' => ['name' => 'Kelulusan Siswa - Hapus', 'module' => 'kelulusan'],
            'kelulusan.verify' => ['name' => 'Kelulusan Siswa - Verifikasi', 'module' => 'kelulusan'],
        ];

        $operatorPerms = [
            'dashboard.view', 'management.view', 'mading.edit_all',
            'gallery.view', 'gallery.create', 'gallery.edit', 'gallery.delete',
        ];

        $bkkPerms = [
            'dashboard.view', 'management.view',
            'job.view', 'job.create', 'job.edit', 'job.delete', 'job.publish',
            'kelulusan.view', 'kelulusan.create', 'kelulusan.edit', 'kelulusan.delete', 'kelulusan.verify',
        ];

        $rolePerms = [
            'operator_sekolah' => $operatorPerms,
            'bkk' => $bkkPerms,
        ];

        // Create permissions that don't exist yet
        foreach ($allPerms as $slug => $attrs) {
            Permission::firstOrCreate(
                ['slug' => $slug],
                ['name' => $attrs['name'], 'module' => $attrs['module'], 'created_at' => now()]
            );
        }
        $this->command->info('All permissions ensured in database.');

        // Assign permissions to roles
        foreach ($rolePerms as $roleSlug => $permSlugs) {
            $role = Role::where('slug', $roleSlug)->first();
            if (! $role) continue;

            foreach ($permSlugs as $permSlug) {
                $perm = Permission::where('slug', $permSlug)->first();
                if (! $perm) continue;
                RolePermission::firstOrCreate([
                    'role_id' => $role->id,
                    'permission_id' => $perm->id,
                ]);
            }

            $this->command->info("Permissions assigned for role: {$roleSlug}");
        }
    }

    protected function seedAccounts(): void
    {
        $accounts = [
            [
                'email' => 'operator.test@smkn11.sch.id',
                'password' => 'smkn11operator',
                'name' => 'Operator Test',
                'role' => 'operator_sekolah',
            ],
            [
                'email' => 'bkk.test@smkn11.sch.id',
                'password' => 'smkn11bkk',
                'name' => 'BKK Test',
                'role' => 'bkk',
            ],
        ];

        foreach ($accounts as $account) {
            if (User::where('email', $account['email'])->exists()) {
                $this->command->warn("Account {$account['email']} already exists, skipping.");
                continue;
            }

            $id = Str::uuid()->toString();

            User::create([
                'id' => $id,
                'email' => $account['email'],
                'password' => Hash::make($account['password']),
                'name' => $account['name'],
                'profile' => ['name' => $account['name']],
                'email_verified_at' => now(),
            ]);

            Profile::create([
                'id' => $id,
                'role' => $account['role'],
                'name' => $account['name'],
                'email' => $account['email'],
                'updated_at' => now(),
            ]);

            $this->command->info("Account created: {$account['email']} ({$account['password']}) [{$account['role']}]");
        }
    }
}
