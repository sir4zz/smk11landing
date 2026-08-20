<?php

namespace App\Services;

use App\Models\Guru;
use App\Models\Profile;
use App\Models\SdmGuru;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Links imported SDM guru records (sdm_gurus) to the existing login account
 * system (users + profiles + legacy gurus). One account per guru is enforced
 * by the unique index on sdm_gurus.user_id.
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
     *
     * @return array<string, mixed>
     */
    public function accountSummary(SdmGuru $guru): array
    {
        $user = $guru->user;

        if (! $user) {
            return [
                'linked' => false,
                'user' => null,
                'identifier' => $guru->nip ?: $guru->nipppk ?: $guru->nuptk ?: '',
            ];
        }

        $profile = $user->profileRecord;

        return [
            'linked' => true,
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
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
            'identifier' => $guru->nip ?: $guru->nipppk ?: $guru->nuptk ?: '',
        ];
    }

    /**
     * Create the login account for an sdm guru. Returns the generated password
     * (when auto-generated) so the operator can share it once.
     *
     * @return array{user: User, password: string}
     */
    public function createAccount(SdmGuru $guru, ?string $email, ?string $password): array
    {
        if ($guru->user_id) {
            throw $this->httpFail('Guru ini sudah memiliki akun login.');
        }

        $email = $this->resolveEmail($guru, $email);
        $password = $this->resolvePassword($password);
        $id = (string) Str::uuid();
        $name = $guru->name ?: 'Guru';

        try {
            DB::transaction(function () use ($id, $guru, $email, $password, $name) {
                $this->assertIdentifiersFree($guru);

                User::create([
                    'id' => $id,
                    'email' => $email,
                    'password' => Hash::make($password),
                    'name' => $name,
                    'profile' => ['name' => $name],
                    'email_verified_at' => now(),
                ]);

                Profile::create([
                    'id' => $id,
                    'role' => 'guru',
                    'name' => $name,
                    'email' => $email,
                    'status' => 'active',
                    'must_change_password' => true,
                    'updated_at' => now(),
                ]);

                Guru::create([
                    'id' => $id,
                    'nip' => $guru->nip ?: null,
                    'nipppk' => $guru->nipppk ?: null,
                    'nuptk' => $guru->nuptk ?: null,
                    'teacher_id' => $this->accounts->generateTeacherId(),
                    'subject' => '',
                    'position' => '',
                    'achievements' => [],
                    'certifications' => [],
                ]);

                $guru->update(['user_id' => $id]);
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
     * Update an existing guru account: email, status (active/inactive) and/or
     * password reset. Contact email is mirrored to sdm_gurus.
     */
    public function updateAccount(SdmGuru $guru, Request $request): User
    {
        $user = $guru->user;

        if (! $user) {
            throw $this->httpFail('Guru ini belum memiliki akun login.');
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

        DB::transaction(function () use ($user, $guru, $request, $email, $password) {
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
                $guru->update($sdmUpdates);
            }
        });

        return $user->fresh(['profileRecord', 'guru']);
    }

    /**
     * Remove the account from an sdm guru (deletes the login account, keeps
     * the imported guru record). sdm_gurus.user_id resets via FK set null.
     */
    public function unlinkAccount(SdmGuru $guru): void
    {
        $user = $guru->user;

        if (! $user) {
            return;
        }

        DB::transaction(function () use ($guru, $user) {
            $guru->update(['user_id' => null]);
            $user->delete();
        });
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private function resolveEmail(SdmGuru $guru, ?string $email): string
    {
        $email = strtolower(trim((string) $email));

        if ($email === '' || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $email = strtolower(trim((string) $guru->email));
        }

        if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL) && ! User::query()->where('email', $email)->exists()) {
            return $email;
        }

        return $this->generateEmail($guru);
    }

    private function generateEmail(SdmGuru $guru): string
    {
        $base = $guru->nip ?: $guru->nipppk ?: $guru->nuptk;
        $digits = $base ? preg_replace('/[^0-9]/', '', $base) : '';
        $prefix = $digits !== '' ? 'nip-'.$digits : 'guru';

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

    private function assertIdentifiersFree(SdmGuru $guru): void
    {
        if ($guru->nip && Guru::query()->where('nip', $guru->nip)->exists()) {
            throw $this->httpFail('NIP sudah terdaftar di akun guru lain.');
        }
        if ($guru->nuptk && Guru::query()->where('nuptk', $guru->nuptk)->exists()) {
            throw $this->httpFail('NUPTK sudah terdaftar di akun guru lain.');
        }
    }

    private function httpFail(string $message): HttpException
    {
        return new HttpException(422, $message);
    }
}