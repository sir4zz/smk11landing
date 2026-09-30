<?php

namespace App\Services;

use App\Models\Guru;
use App\Models\Profile;
use App\Models\SdmGuru;
use App\Models\SdmTendik;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Links imported SDM records (sdm_gurus / sdm_tendiks) to the existing login
 * account system (users + profiles + legacy gurus). One account per SDM record
 * is enforced by the unique index on user_id.
 */
class SdmAccountService
{
    public const EMAIL_DOMAIN = 'mading.smkn11.sch.id';

    public function __construct(protected AccountService $accounts)
    {
    }

    /**
     * Resolve the linked sdm_gurus record for a logged-in user. Never trusts
     * a client-supplied guru id — the record is derived from the account.
     */
    public function resolveGuruForUser(User $user): ?SdmGuru
    {
        $sdm = SdmGuru::query()->where('user_id', $user->id)->first();

        if ($sdm) {
            return $sdm;
        }

        // Fallback: match against legacy guru identifiers (NIP / NUPTK).
        $legacy = $user->guru;

        if ($legacy && ($legacy->nip || $legacy->nuptk)) {
            $sdm = SdmGuru::query()
                ->where(function ($q) use ($legacy) {
                    if ($legacy->nip) {
                        $q->orWhere('nip', $legacy->nip);
                    }
                    if ($legacy->nuptk) {
                        $q->orWhere('nuptk', $legacy->nuptk);
                    }
                })
                ->first();

            if ($sdm && ! $sdm->user_id) {
                $sdm->update(['user_id' => $user->id]);
            }

            return $sdm;
        }

        return null;
    }

    /**
     * Account summary used by the admin/operator account panel.
     * Accepts both SdmGuru and SdmTendik.
     *
     * @param  SdmGuru|SdmTendik  $person
     * @return array<string, mixed>
     */
    public function accountSummary(Model $person): array
    {
        $user = $person->user;

        if (! $user) {
            return [
                'linked' => false,
                'user' => null,
                'identifier' => $person->nip ?: $person->nipppk ?: $person->nuptk ?: '',
            ];
        }

        $profile = $user->profileRecord;

        return [
            'linked' => true,
            'user' => [
                'id' => $user->id,
                'username' => $user->username ?? '',
                'email' => $user->email ?? '',
                'name' => $user->name,
                'role' => $profile?->role,
                'status' => $profile?->status ?? 'active',
                'must_change_password' => (bool) ($profile?->must_change_password ?? false),
                'created_at' => $user->created_at?->toIso8601String(),
                'guru' => $user->guru ? [
                    'nip' => $user->guru->nip ?? '',
                    'nuptk' => $user->guru->nuptk ?? '',
                    'teacher_id' => $user->guru->teacher_id ?? '',
                ] : null,
            ],
            'identifier' => $person->nip ?: $person->nipppk ?: $person->nuptk ?: '',
        ];
    }

    /**
     * Create the login account for an SDM person (guru or tendik).
     * Returns the generated password (when auto-generated).
     *
     * @param  SdmGuru|SdmTendik  $person
     * @return array{user: User, password: string}
     */
    public function createAccount(Model $person, ?string $email, ?string $password): array
    {
        if ($person->user_id) {
            $label = $person instanceof SdmTendik ? 'Tendik ini' : 'Guru ini';
            throw $this->httpFail($label.' sudah memiliki akun login.');
        }

        $isTendik = $person instanceof SdmTendik;
        $role = $isTendik ? 'guru' : 'guru'; // Keduanya role guru (akun staff)
        $defaultName = $isTendik ? 'Tendik' : 'Guru';

        $email = $this->resolveEmail($person, $email);
        $password = $this->resolvePassword($password);
        $id = (string) Str::uuid();
        $name = $person->name ?: $defaultName;

        try {
            DB::transaction(function () use ($id, $person, $email, $password, $name, $role) {
                $this->assertIdentifiersFree($person);

                $username = $this->generateUsername($person);

                User::create([
                    'id' => $id,
                    'email' => $email,
                    'username' => $username,
                    'password' => Hash::make($password),
                    'name' => $name,
                    'profile' => ['name' => $name],
                    'email_verified_at' => now(),
                ]);

                Profile::create([
                    'id' => $id,
                    'role' => $role,
                    'name' => $name,
                    'email' => $email,
                    'status' => 'active',
                    'must_change_password' => true,
                    'updated_at' => now(),
                ]);

                Guru::create([
                    'id' => $id,
                    'nip' => $person->nip ?: null,
                    'nipppk' => $person->nipppk ?: null,
                    'nuptk' => $person->nuptk ?: null,
                    'teacher_id' => $this->accounts->generateTeacherId(),
                    'subject' => '',
                    'position' => '',
                    'achievements' => [],
                    'certifications' => [],
                ]);

                $person->update(['user_id' => $id]);
            });
        } catch (HttpException $e) {
            throw $e;
        } catch (\Throwable $e) {
            report($e);
            throw $this->httpFail('Gagal membuat akun. Silakan coba lagi.');
        }

        $user = User::query()->with(['profileRecord', 'guru'])->findOrFail($id);

        return ['user' => $user, 'password' => $password];
    }

    /**
     * Update an existing SDM account: email, status and/or password reset.
     *
     * @param  SdmGuru|SdmTendik  $person
     */
    public function updateAccount(Model $person, Request $request): User
    {
        $user = $person->user;

        if (! $user) {
            throw $this->httpFail('Data ini belum memiliki akun login.');
        }

        $email = null;
        if ($request->has('email')) {
            $email = strtolower(trim((string) $request->input('email')));

            if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
                throw $this->httpFail('Email wajib diisi dengan benar.');
            }
            if ($email !== $user->email && User::query()->where('email', $email)->exists()) {
                throw $this->httpFail('Email sudah terdaftar.');
            }
        }

        $password = (string) $request->input('password', '');
        if ($password !== '' && mb_strlen($password) < 6) {
            throw $this->httpFail('Password minimal 6 karakter.');
        }

        DB::transaction(function () use ($user, $person, $request, $email, $password) {
            $userUpdates = [];
            $profileUpdates = [];
            $sdmUpdates = [];

            if ($email !== null) {
                $userUpdates['email'] = $email;
                $profileUpdates['email'] = $email;
                $sdmUpdates['email'] = $email;
            }

            if ($request->has('status')) {
                $profileUpdates['status'] = $request->input('status') === 'inactive' ? 'inactive' : 'active';
            }

            if ($password !== '') {
                $userUpdates['password'] = Hash::make($password);
                $profileUpdates['must_change_password'] = true;
            }

            if ($userUpdates) {
                $user->update($userUpdates);
            }
            if ($profileUpdates) {
                $user->profileRecord?->update($profileUpdates);
            }
            if ($sdmUpdates) {
                $person->update($sdmUpdates);
            }
        });

        return $user->fresh(['profileRecord', 'guru']);
    }

    /**
     * Remove the account from an SDM record (deletes the login account, keeps
     * the imported SDM record). user_id resets via FK set null.
     *
     * @param  SdmGuru|SdmTendik  $person
     */
    public function unlinkAccount(Model $person): void
    {
        $user = $person->user;

        if (! $user) {
            return;
        }

        DB::transaction(function () use ($person, $user) {
            $person->update(['user_id' => null]);
            $user->delete();
        });
    }

    /**
     * Bulk-create login accounts for ALL SDM persons (guru + tendik) that
     * don't have linked accounts yet.
     *
     * IMPORTANT: plaintext passwords are returned ONE TIME so admin can
     * distribute them securely. They are stored hashed and cannot be
     * retrieved again — admin must download/export immediately.
     */
    public function bulkCreateAccounts(): array
    {
        $persons = collect();
        $persons = $persons->concat(SdmGuru::query()->whereNull('user_id')->get());
        $persons = $persons->concat(SdmTendik::query()->whereNull('user_id')->get());

        $created = 0;
        $skipped = 0;
        $errors = [];
        $accounts = [];

        foreach ($persons as $person) {
            try {
                $result = $this->createAccount($person, null, null);
                $created++;
                $user = $result['user']->fresh(['profileRecord']);
                $accounts[] = [
                    'name' => $person->name,
                    'type' => $person instanceof SdmTendik ? 'tendik' : 'guru',
                    'identifier' => $person->nip ?: $person->nipppk ?: $person->nuptk ?: '',
                    'username' => $user->username ?? '',
                    'email' => $user->email ?? '',
                    'password' => $result['password'],
                ];
            } catch (\Throwable $e) {
                $skipped++;
                $errors[] = [
                    'name' => $person->name,
                    'type' => $person instanceof SdmTendik ? 'tendik' : 'guru',
                    'message' => $e->getMessage(),
                ];
            }
        }

        // Hapus cache stats agar jumlah tenaga pengajar ter-update
        Cache::forget(\App\Http\Controllers\StatsController::CACHE_KEY);

        return [
            'summary' => [
                'total' => $persons->count(),
                'created' => $created,
                'skipped' => $skipped,
            ],
            'errors' => $errors,
            'accounts' => $accounts,
        ];
    }

    /**
     * RECOVERY: destroy ALL existing SDM login accounts and recreate them
     * fresh with the current (NIP-polos, no `nip-` prefix) scheme.
     *
     * Used when bulk-create was run with the old `nip-xxx` usernames and/or
     * plaintext passwords were never distributed (hashed passwords are
     * unrecoverable). Old users are deleted — profiles + legacy guru rows
     * are removed via DB cascade, SDM records are kept and relinked.
     * Returns plaintext passwords ONE TIME for secure distribution.
     */
    public function bulkResetPasswords(): array
    {
        $persons = collect();
        $persons = $persons->concat(SdmGuru::query()->whereNotNull('user_id')->with('user')->get());
        $persons = $persons->concat(SdmTendik::query()->whereNotNull('user_id')->with('user')->get());

        $reset = 0;
        $skipped = 0;
        $errors = [];
        $accounts = [];

        foreach ($persons as $person) {
            $type = $person instanceof SdmTendik ? 'tendik' : 'guru';

            try {
                // 1. Destroy old login account (if any). Cascade removes the
                // linked profile + legacy guru row; SDM row itself is kept.
                $oldUser = $person->user;
                if ($oldUser) {
                    $oldUser->tokens()->delete();
                    $person->update(['user_id' => null]);
                    $oldUser->delete();
                } else {
                    $person->update(['user_id' => null]);
                }

                // 2. Recreate fresh with NIP-polos username scheme.
                $fresh = $person->fresh();
                $result = $this->createAccount($fresh, null, null);
                $user = $result['user']->fresh(['profileRecord']);

                $reset++;
                $accounts[] = [
                    'name' => $fresh->name,
                    'type' => $type,
                    'identifier' => $fresh->nip ?: $fresh->nipppk ?: $fresh->nuptk ?: '',
                    'username' => $user->username ?? '',
                    'email' => $user->email ?? '',
                    'password' => $result['password'],
                ];
            } catch (\Throwable $e) {
                report($e);
                $skipped++;
                $errors[] = [
                    'name' => $person->name,
                    'type' => $type,
                    'message' => $e->getMessage(),
                ];
            }
        }

        Cache::forget(\App\Http\Controllers\StatsController::CACHE_KEY);

        return [
            'summary' => [
                'total' => $persons->count(),
                'reset' => $reset,
                'skipped' => $skipped,
            ],
            'errors' => $errors,
            'accounts' => $accounts,
        ];
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private function resolveEmail(Model $person, ?string $email): string
    {
        $email = strtolower(trim((string) $email));

        if ($email === '' || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $email = strtolower(trim((string) $person->email));
        }

        if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL) && ! User::query()->where('email', $email)->exists()) {
            return $email;
        }

        return $this->generateEmail($person);
    }

    private function generateUsername(Model $person): string
    {
        // New scheme: bare NIP/NIPPPK/NUPTK digits (no `nip-` prefix) so
        // teachers just type their NIP. Old `nip-xxx` accounts keep working
        // via prefix-tolerant login in AccountService::resolveUser().
        $base = $person->nip ?: $person->nipppk ?: $person->nuptk;
        $digits = $base ? preg_replace('/[^0-9]/', '', $base) : '';
        $prefix = $digits !== '' ? $digits : ($person instanceof SdmTendik ? 'tendik' : 'guru');

        $candidate = $prefix;
        $username = $candidate;
        $i = 1;

        while (User::query()->where('username', $username)->exists()) {
            $username = $prefix.'-'.$i;
            $i++;
        }

        return $username;
    }

    private function generateEmail(Model $person): string
    {
        $base = $person->nip ?: $person->nipppk ?: $person->nuptk;
        $digits = $base ? preg_replace('/[^0-9]/', '', $base) : '';
        $prefix = $digits !== '' ? $digits : ($person instanceof SdmTendik ? 'tendik' : 'guru');

        $candidate = strtolower($prefix).'@'.self::EMAIL_DOMAIN;
        $email = $candidate;
        $i = 1;

        while (User::query()->where('email', $email)->exists()) {
            $email = strtolower($prefix).'-'.$i.'@'.self::EMAIL_DOMAIN;
            $i++;
        }

        return $email;
    }

    private function resolvePassword(?string $password): string
    {
        $password = (string) $password;

        return mb_strlen($password) >= 6 ? $password : Str::random(10);
    }

    /**
     * @param  SdmGuru|SdmTendik  $person
     */
    private function assertIdentifiersFree(Model $person): void
    {
        if ($person->nip && Guru::query()->where('nip', $person->nip)->exists()) {
            throw $this->httpFail('NIP sudah terdaftar di akun lain.');
        }
        if ($person->nuptk && Guru::query()->where('nuptk', $person->nuptk)->exists()) {
            throw $this->httpFail('NUPTK sudah terdaftar di akun lain.');
        }
    }

    private function httpFail(string $message): HttpException
    {
        return new HttpException(422, $message);
    }
}
