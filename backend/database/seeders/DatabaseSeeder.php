<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Profile;
use App\Models\Role;
use App\Models\RolePermission;
use App\Models\Student;
use App\Models\StudentAccount;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use \Illuminate\Database\Console\Seeds\WithoutModelEvents;

    public function run(): void
    {
        $this->seedRbac();
        $this->seedAccounts();
    }

    protected function seedRbac(): void
    {
        $roles = ['admin' => 'Admin', 'guru' => 'Guru', 'osis' => 'OSIS'];

        $roleIds = [];
        foreach ($roles as $slug => $name) {
            $roleIds[$slug] = Role::firstOrCreate(['slug' => $slug], ['name' => $name, 'created_at' => now()])->id;
        }

        $permissions = [
            ['dashboard.view', 'Dashboard - Lihat', 'dashboard'],

            ['osis.view', 'OSIS - Lihat', 'osis'],
            ['osis.create', 'OSIS - Buat', 'osis'],
            ['osis.edit', 'OSIS - Ubah', 'osis'],
            ['osis.delete', 'OSIS - Hapus', 'osis'],
            ['osis.publish', 'OSIS - Publikasi', 'osis'],

            ['osis.activities.view', 'Kegiatan OSIS - Lihat', 'osis.activities'],
            ['osis.activities.create', 'Kegiatan OSIS - Buat', 'osis.activities'],
            ['osis.activities.edit', 'Kegiatan OSIS - Ubah', 'osis.activities'],
            ['osis.activities.delete', 'Kegiatan OSIS - Hapus', 'osis.activities'],

            ['extracurricular.view', 'Ekstrakurikuler - Lihat', 'extracurricular'],
            ['extracurricular.create', 'Ekstrakurikuler - Buat', 'extracurricular'],
            ['extracurricular.edit', 'Ekstrakurikuler - Ubah', 'extracurricular'],
            ['extracurricular.delete', 'Ekstrakurikuler - Hapus', 'extracurricular'],
            ['extracurricular.publish', 'Ekstrakurikuler - Publikasi', 'extracurricular'],

            ['kesemaptaan.view', 'Kesemaptaan - Lihat', 'kesemaptaan'],
            ['kesemaptaan.create', 'Kesemaptaan - Buat', 'kesemaptaan'],
            ['kesemaptaan.edit', 'Kesemaptaan - Ubah', 'kesemaptaan'],
            ['kesemaptaan.delete', 'Kesemaptaan - Hapus', 'kesemaptaan'],
            ['kesemaptaan.publish', 'Kesemaptaan - Publikasi', 'kesemaptaan'],

            ['mading.view', 'Mading - Lihat', 'mading'],
            ['mading.create', 'Mading - Buat', 'mading'],
            ['mading.edit_own', 'Mading - Ubah Karya Sendiri', 'mading'],
            ['mading.edit_all', 'Mading - Ubah Semua Karya', 'mading'],
            ['mading.delete', 'Mading - Hapus', 'mading'],
            ['mading.submit_review', 'Mading - Kirim Review', 'mading'],
            ['mading.review', 'Mading - Review', 'mading'],
            ['mading.publish', 'Mading - Publikasi', 'mading'],

            ['spmb.view', 'SPMB - Lihat', 'spmb'],
            ['spmb.create', 'SPMB - Buat', 'spmb'],
            ['spmb.edit', 'SPMB - Ubah', 'spmb'],
            ['spmb.delete', 'SPMB - Hapus', 'spmb'],
            ['spmb.verify', 'SPMB - Verifikasi', 'spmb'],

            ['management.view', 'Manajemen - Lihat', 'management'],
        ];

        $permissionIds = [];
        foreach ($permissions as [$slug, $name, $module]) {
            $permissionIds[$slug] = Permission::firstOrCreate(
                ['slug' => $slug],
                ['name' => $name, 'module' => $module, 'created_at' => now()]
            )->id;
        }

        // Admin: all permissions (mirrors PermissionService admin = full access).
        foreach ($permissionIds as $permissionId) {
            RolePermission::firstOrCreate([
                'role_id' => $roleIds['admin'],
                'permission_id' => $permissionId,
            ]);
        }

        $guruSlugs = [
            'dashboard.view',
            'mading.view', 'mading.create', 'mading.edit_own', 'mading.submit_review',
            'mading.review', 'mading.publish', 'mading.edit_all', 'mading.delete',
            'management.view',
            'osis.view',
            'spmb.view',
        ];

        $osisSlugs = [
            'dashboard.view',
            'osis.view', 'osis.create', 'osis.edit',
            'osis.activities.view', 'osis.activities.create', 'osis.activities.edit',
            'extracurricular.view', 'extracurricular.create', 'extracurricular.edit', 'extracurricular.delete',
            'kesemaptaan.view', 'kesemaptaan.create', 'kesemaptaan.edit', 'kesemaptaan.delete',
            'mading.view', 'mading.create', 'mading.edit_own', 'mading.submit_review',
            'mading.review', 'mading.publish',
            'spmb.view',
        ];

        foreach ([['guru', $guruSlugs], ['osis', $osisSlugs]] as [$roleSlug, $slugs]) {
            foreach ($slugs as $slug) {
                if (! isset($permissionIds[$slug])) {
                    continue;
                }
                RolePermission::firstOrCreate([
                    'role_id' => $roleIds[$roleSlug],
                    'permission_id' => $permissionIds[$slug],
                ]);
            }
        }
    }

    protected function seedAccounts(): void
    {
        $accounts = [
            [
                'id' => 'ea54be9b-1229-442c-aa88-a5ff983b8b60',
                'email' => 'admin.test@smkn11.sch.id',
                'password' => 'smkn11admin',
                'name' => 'Admin Test',
                'role' => 'admin',
            ],
            [
                'id' => 'd5c06893-5d35-4681-b86f-2610c911e64a',
                'email' => 'guru.test@smkn11.sch.id',
                'password' => 'smkn11guru',
                'name' => 'Guru Test',
                'role' => 'guru',
            ],
            [
                'id' => '8fbe17ad-4d21-40e2-a79e-82fc0e302581',
                'email' => 'osis.test@smkn11.sch.id',
                'password' => 'smkn11osis',
                'name' => 'OSIS Test',
                'role' => 'osis',
            ],
        ];

        foreach ($accounts as $account) {
            $user = User::updateOrCreate(
                ['id' => $account['id']],
                [
                    'email' => $account['email'],
                    'password' => Hash::make($account['password']),
                    'name' => $account['name'],
                    'profile' => ['name' => $account['name']],
                    'email_verified_at' => now(),
                ]
            );

            Profile::updateOrCreate(
                ['id' => $account['id']],
                [
                    'role' => $account['role'],
                    'name' => $account['name'],
                    'email' => $account['email'],
                    'updated_at' => now(),
                ]
            );
        }

        $studentId = 'da55f59e-1389-4a13-b19e-34c7e62f1a78';
        $studentEmail = 'nisn-1234567890@mading.smkn11.sch.id';

        User::updateOrCreate(
            ['id' => $studentId],
            [
                'email' => $studentEmail,
                'password' => Hash::make('smkn11student'),
                'name' => 'Student Test',
                'profile' => ['name' => 'Student Test'],
                'email_verified_at' => now(),
            ]
        );

        Profile::updateOrCreate(
            ['id' => $studentId],
            [
                'role' => 'student',
                'name' => 'Student Test',
                'email' => $studentEmail,
                'updated_at' => now(),
            ]
        );

        Student::updateOrCreate(
            ['id' => $studentId],
            [
                'nisn' => '1234567890',
                'name' => 'Student Test',
                'class' => 'XII TJKT 1',
                'major' => 'Teknik Jaringan',
            ]
        );

        StudentAccount::updateOrCreate(
            ['id' => $studentId],
            [
                'student_id' => $studentId,
                'email' => $studentEmail,
                'status' => 'active',
            ]
        );
    }
}
