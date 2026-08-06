<?php

namespace App\Services;

use App\Models\Guru;
use App\Models\OsisAccount;
use App\Models\Student;
use App\Models\User;
use Illuminate\Support\Str;

/**
 * Shared helpers for the account system (guru / siswa / OSIS):
 * resolving login identifiers, generating unique IDs and building the
 * combined profile payload used by auth, my-profile and admin endpoints.
 */
class AccountService
{
    /**
     * Resolve a login identifier (email, NIP, NUPTK, teacher_id, NISN or
     * member_id) to a user account, or null when not found.
     */
    public function resolveUser(string $identifier): ?User
    {
        $term = trim($identifier);

        if ($term === '') {
            return null;
        }

        if (str_contains($term, '@')) {
            return User::query()->where('email', strtolower($term))->first();
        }

        $guru = Guru::query()
            ->where('nip', $term)
            ->orWhere('nuptk', $term)
            ->orWhere('teacher_id', $term)
            ->first();

        if ($guru) {
            return User::query()->find($guru->id);
        }

        $osis = OsisAccount::query()
            ->where('member_id', $term)
            ->orWhere('nisn', $term)
            ->first();

        if ($osis) {
            return User::query()->find($osis->id);
        }

        $student = Student::query()->where('nisn', $term)->first();

        if ($student) {
            return User::query()->find($student->id);
        }

        return null;
    }

    public function generateTeacherId(): string
    {
        do {
            $id = 'GR'.strtoupper(Str::random(6));
        } while (Guru::query()->where('teacher_id', $id)->exists());

        return $id;
    }

    public function generateMemberId(): string
    {
        do {
            $id = 'OS'.strtoupper(Str::random(6));
        } while (OsisAccount::query()->where('member_id', $id)->exists());

        return $id;
    }

    /**
     * Build the combined profile payload (profile fields + role-specific data).
     */
    public function profilePayload(User $user): array
    {
        $profile = $user->profileRecord;

        return [
            'id' => $user->id,
            'role' => $profile?->role,
            'status' => $profile?->status ?? 'active',
            'must_change_password' => (bool) ($profile?->must_change_password ?? false),
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $profile?->phone ?? '',
            'photo' => $profile?->photo ?? '',
            'bio' => $profile?->bio ?? '',
            'address' => $profile?->address ?? '',
            'social' => [
                'instagram' => $profile?->instagram ?? '',
                'facebook' => $profile?->facebook ?? '',
                'twitter' => $profile?->twitter ?? '',
                'tiktok' => $profile?->tiktok ?? '',
                'youtube' => $profile?->youtube ?? '',
                'linkedin' => $profile?->linkedin ?? '',
                'website' => $profile?->website ?? '',
                'github' => $profile?->github ?? '',
            ],
            'guru' => $user->guru ? [
                'nip' => $user->guru->nip ?? '',
                'nuptk' => $user->guru->nuptk ?? '',
                'teacher_id' => $user->guru->teacher_id ?? '',
                'subject' => $user->guru->subject ?? '',
                'position' => $user->guru->position ?? '',
                'achievements' => $user->guru->achievements ?? [],
                'certifications' => $user->guru->certifications ?? [],
            ] : null,
            'osis' => $user->osisAccount ? [
                'member_id' => $user->osisAccount->member_id ?? '',
                'nisn' => $user->osisAccount->nisn ?? '',
                'division' => $user->osisAccount->division ?? '',
                'position' => $user->osisAccount->position ?? '',
                'achievements' => $user->osisAccount->achievements ?? [],
                'work_programs' => $user->osisAccount->work_programs ?? [],
            ] : null,
            'student' => $user->student ? [
                'nisn' => $user->student->nisn ?? '',
                'class' => $user->student->class ?? '',
                'major' => $user->student->major ?? '',
                'achievements' => $user->student->achievements ?? [],
            ] : null,
        ];
    }
}
