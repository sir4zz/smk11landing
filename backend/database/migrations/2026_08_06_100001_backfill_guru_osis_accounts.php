<?php

use App\Models\Guru;
use App\Models\OsisAccount;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Str;

/**
 * Backfill guru and osis_accounts rows for existing accounts that were
 * created before the account-profile system was introduced.
 */
return new class extends Migration
{
    public function up(): void
    {
        Profile::query()->where('role', 'guru')->pluck('id')->each(function (string $userId) {
            if (! Guru::query()->where('id', $userId)->exists()) {
                Guru::create([
                    'id' => $userId,
                    'teacher_id' => $this->uniqueTeacherId(),
                    'nip' => null,
                    'nuptk' => null,
                    'subject' => '',
                    'position' => '',
                    'achievements' => [],
                    'certifications' => [],
                ]);
            }
        });

        Profile::query()->where('role', 'osis')->pluck('id')->each(function (string $userId) {
            if (! OsisAccount::query()->where('id', $userId)->exists()) {
                OsisAccount::create([
                    'id' => $userId,
                    'member_id' => $this->uniqueMemberId(),
                    'nisn' => null,
                    'division' => '',
                    'position' => '',
                    'achievements' => [],
                    'work_programs' => [],
                ]);
            }
        });
    }

    public function down(): void
    {
        // Data backfill is intentionally not reversed.
    }

    private function uniqueTeacherId(): string
    {
        do {
            $id = 'GR'.strtoupper(Str::random(6));
        } while (Guru::query()->where('teacher_id', $id)->exists());

        return $id;
    }

    private function uniqueMemberId(): string
    {
        do {
            $id = 'OS'.strtoupper(Str::random(6));
        } while (OsisAccount::query()->where('member_id', $id)->exists());

        return $id;
    }
};
