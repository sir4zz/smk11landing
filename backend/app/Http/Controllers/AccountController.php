<?php

namespace App\Http\Controllers;

use App\Models\Guru;
use App\Models\OsisAccount;
use App\Models\Profile;
use App\Models\Student;
use App\Models\StudentAccount;
use App\Models\User;
use App\Services\AccountService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Admin-only management of staff (admin, guru, osis) and student accounts.
 */
class AccountController extends Controller
{
    private const MANAGED_ROLES = ['admin', 'guru', 'osis', 'student'];

    public function __construct(protected AccountService $accounts)
    {
    }

    public function index(Request $request)
    {
        $query = User::query()
            ->with(['profileRecord', 'student', 'guru', 'osisAccount'])
            ->whereHas('profileRecord', fn ($q) => $q->whereIn('role', self::MANAGED_ROLES));

        if ($request->has('role') && in_array($request->query('role'), self::MANAGED_ROLES, true)) {
            $query->whereHas('profileRecord', fn ($q) => $q->where('role', $request->query('role')));
        }

        if ($request->filled('search')) {
            $term = '%'.trim((string) $request->query('search')).'%';
            $query->where(function ($q) use ($term) {
                $q->where('email', 'like', $term)
                    ->orWhere('name', 'like', $term)
                    ->orWhereHas('guru', fn ($g) => $g->where('nip', 'like', $term)->orWhere('nuptk', 'like', $term)->orWhere('teacher_id', 'like', $term))
                    ->orWhereHas('osisAccount', fn ($o) => $o->where('member_id', 'like', $term)->orWhere('nisn', 'like', $term))
                    ->orWhereHas('student', fn ($s) => $s->where('nisn', 'like', $term));
            });
        }

        return response()->json(
            $query->orderBy('created_at', 'asc')->get()->map(fn (User $user) => $this->payload($user))
        );
    }

    public function store(Request $request)
    {
        $role = (string) $request->input('role');
        $name = trim((string) $request->input('name', ''));

        if (! in_array($role, self::MANAGED_ROLES, true)) {
            return $this->fail('Role tidak valid.');
        }
        if (mb_strlen($name) < 2) {
            return $this->fail('Nama wajib diisi.');
        }

        $id = (string) Str::uuid();

        try {
            DB::transaction(function () use ($id, $role, $name, $request) {
                if ($role === 'student') {
                    $this->createStudent($id, $request, $name);
                } elseif ($role === 'guru') {
                    $this->createGuru($id, $request, $name);
                } elseif ($role === 'osis') {
                    $this->createOsis($id, $request, $name);
                } else {
                    $this->createStaff($id, $request, $role, $name);
                }
            });
        } catch (HttpException $e) {
            throw $e;
        } catch (\Throwable $e) {
            report($e);
            return $this->fail('Gagal membuat akun. Silakan coba lagi.');
        }

        return response()->json($this->payload($this->loadAccount($id)), 201);
    }

    public function update(Request $request, string $id)
    {
        $user = $this->loadAccount($id);
        $currentRole = $user->profileRecord?->role ?? 'applicant';
        $targetRole = $request->has('role') ? (string) $request->input('role') : $currentRole;

        if (! in_array($targetRole, self::MANAGED_ROLES, true)) {
            return $this->fail('Role tidak valid.');
        }

        if ($request->user()->id === $user->id && $targetRole !== $currentRole) {
            return response()->json(['error' => ['message' => 'Tidak dapat mengubah role akun sendiri.']], 403);
        }

        if ($currentRole === 'admin' && $targetRole !== 'admin' && $this->adminCount() <= 1) {
            return response()->json(['error' => ['message' => 'Tidak dapat menonaktifkan admin terakhir.']], 403);
        }

        try {
            DB::transaction(function () use ($user, $request, $currentRole, $targetRole) {
                if ($currentRole === 'student' && $targetRole !== 'student') {
                    $this->studentToStaff($user, $request, $targetRole);
                } elseif ($targetRole === 'student' && $currentRole !== 'student') {
                    $this->staffToStudent($user, $request);
                } elseif ($currentRole === 'student') {
                    $this->updateStudent($user, $request);
                } else {
                    $this->updateStaff($user, $request, $targetRole);
                }
            });
        } catch (HttpException $e) {
            throw $e;
        } catch (\Throwable $e) {
            report($e);
            return $this->fail('Gagal memperbarui akun. Silakan coba lagi.');
        }

        return response()->json($this->payload($this->loadAccount($id)));
    }

    public function destroy(Request $request, string $id)
    {
        $user = $this->loadAccount($id);

        if ($request->user()->id === $user->id) {
            return response()->json(['error' => ['message' => 'Tidak dapat menghapus akun sendiri.']], 403);
        }
        if ($user->profileRecord?->role === 'admin' && $this->adminCount() <= 1) {
            return response()->json(['error' => ['message' => 'Tidak dapat menghapus admin terakhir.']], 403);
        }

        $user->delete();

        return response()->json(['data' => null, 'error' => null]);
    }

    // ------------------------------------------------------------------
    // Creation
    // ------------------------------------------------------------------

    private function createStaff(string $id, Request $request, string $role, string $name): void
    {
        $email = strtolower(trim((string) $request->input('email', '')));
        $password = (string) $request->input('password', '');

        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw $this->httpFail('Email wajib diisi dengan benar.');
        }
        if (mb_strlen($password) < 6) {
            throw $this->httpFail('Password minimal 6 karakter.');
        }
        if (User::query()->where('email', $email)->exists()) {
            throw $this->httpFail('Email sudah terdaftar.');
        }

        $this->createUserWithProfile($id, $name, $email, $password, $role, $request);
    }

    private function createGuru(string $id, Request $request, string $name): void
    {
        $email = strtolower(trim((string) $request->input('email', '')));
        $password = (string) $request->input('password', '');
        $nip = trim((string) $request->input('nip', ''));
        $nuptk = trim((string) $request->input('nuptk', ''));

        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw $this->httpFail('Email wajib diisi dengan benar.');
        }
        if (mb_strlen($password) < 6) {
            throw $this->httpFail('Password minimal 6 karakter.');
        }
        if (User::query()->where('email', $email)->exists()) {
            throw $this->httpFail('Email sudah terdaftar.');
        }
        if ($nip !== '' && Guru::query()->where('nip', $nip)->exists()) {
            throw $this->httpFail('NIP sudah terdaftar.');
        }
        if ($nuptk !== '' && Guru::query()->where('nuptk', $nuptk)->exists()) {
            throw $this->httpFail('NUPTK sudah terdaftar.');
        }

        $this->createUserWithProfile($id, $name, $email, $password, 'guru', $request);
        Guru::create([
            'id' => $id,
            'nip' => $nip ?: null,
            'nuptk' => $nuptk ?: null,
            'teacher_id' => $this->accounts->generateTeacherId(),
            'subject' => (string) $request->input('subject', ''),
            'position' => (string) $request->input('position', ''),
            'achievements' => $this->jsonList($request->input('achievements')),
            'certifications' => $this->jsonList($request->input('certifications')),
        ]);
    }

    private function createOsis(string $id, Request $request, string $name): void
    {
        $email = strtolower(trim((string) $request->input('email', '')));
        $password = (string) $request->input('password', '');
        $nisn = trim((string) $request->input('nisn', ''));

        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw $this->httpFail('Email wajib diisi dengan benar.');
        }
        if (mb_strlen($password) < 6) {
            throw $this->httpFail('Password minimal 6 karakter.');
        }
        if (User::query()->where('email', $email)->exists()) {
            throw $this->httpFail('Email sudah terdaftar.');
        }
        if ($nisn !== '' && OsisAccount::query()->where('nisn', $nisn)->exists()) {
            throw $this->httpFail('NISN sudah terdaftar.');
        }

        $this->createUserWithProfile($id, $name, $email, $password, 'osis', $request);
        OsisAccount::create([
            'id' => $id,
            'member_id' => $this->accounts->generateMemberId(),
            'nisn' => $nisn ?: null,
            'division' => (string) $request->input('division', ''),
            'position' => (string) $request->input('position', ''),
            'achievements' => $this->jsonList($request->input('achievements')),
            'work_programs' => $this->jsonList($request->input('work_programs')),
        ]);
    }

    private function createStudent(string $id, Request $request, string $name): void
    {
        $nisn = trim((string) $request->input('nisn', ''));
        $pin = (string) $request->input('pin', '');

        if (mb_strlen($nisn) < 4) {
            throw $this->httpFail('NISN tidak valid (minimal 4 karakter).');
        }
        if (mb_strlen($pin) < 4) {
            throw $this->httpFail('PIN minimal 4 karakter.');
        }

        $email = $this->studentEmail($nisn);

        if (User::query()->where('email', $email)->exists() || Student::query()->where('nisn', $nisn)->exists()) {
            throw $this->httpFail('NISN sudah terdaftar.');
        }

        $this->createUserWithProfile($id, $name, $email, $pin, 'student', $request);
        $this->createStudentRecords($id, $nisn, $name, $email, $request);
    }

    // ------------------------------------------------------------------
    // Update / conversion
    // ------------------------------------------------------------------

    private function studentToStaff(User $user, Request $request, string $targetRole): void
    {
        $email = strtolower(trim((string) $request->input('email', '')));
        $password = (string) $request->input('password', '');

        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw $this->httpFail('Email wajib diisi dengan benar.');
        }
        if ($email !== $user->email && User::query()->where('email', $email)->exists()) {
            throw $this->httpFail('Email sudah terdaftar.');
        }
        if ($password !== '' && mb_strlen($password) < 6) {
            throw $this->httpFail('Password minimal 6 karakter.');
        }

        StudentAccount::query()->where('student_id', $user->id)->delete();
        Student::query()->where('id', $user->id)->delete();

        $this->applyStaffChanges($user, $email, $password, $targetRole, $request);
    }

    private function staffToStudent(User $user, Request $request): void
    {
        $nisn = trim((string) $request->input('nisn', ''));
        $pin = (string) $request->input('pin', '');

        if (mb_strlen($nisn) < 4) {
            throw $this->httpFail('NISN tidak valid (minimal 4 karakter).');
        }
        if ($pin !== '' && mb_strlen($pin) < 4) {
            throw $this->httpFail('PIN minimal 4 karakter.');
        }

        $email = $this->studentEmail($nisn);

        if (($email !== $user->email && User::query()->where('email', $email)->exists()) || Student::query()->where('nisn', $nisn)->exists()) {
            throw $this->httpFail('NISN sudah terdaftar.');
        }

        Guru::query()->where('id', $user->id)->delete();
        OsisAccount::query()->where('id', $user->id)->delete();

        $name = trim((string) $request->input('name', $user->name));
        $this->createStudentRecords($user->id, $nisn, $name, $email, $request);

        $updates = ['name' => $name, 'email' => $email];
        if ($pin !== '') {
            $updates['password'] = $pin;
        }
        $user->update($updates);
        $user->profileRecord?->update(['role' => 'student', 'name' => $name, 'email' => $email]);
    }

    private function updateStudent(User $user, Request $request): void
    {
        $student = $user->student;
        $nisn = trim((string) $request->input('nisn', $student?->nisn ?? ''));
        $pin = (string) $request->input('pin', '');
        $name = trim((string) $request->input('name', $user->name));

        if (mb_strlen($nisn) < 4) {
            throw $this->httpFail('NISN tidak valid (minimal 4 karakter).');
        }
        if (Student::query()->where('nisn', $nisn)->where('id', '!=', $user->id)->exists()) {
            throw $this->httpFail('NISN sudah terdaftar.');
        }
        if ($pin !== '' && mb_strlen($pin) < 4) {
            throw $this->httpFail('PIN minimal 4 karakter.');
        }

        $email = $this->studentEmail($nisn);
        if ($email !== $user->email) {
            if (User::query()->where('email', $email)->exists()) {
                throw $this->httpFail('NISN sudah terdaftar.');
            }
            $user->update(['email' => $email]);
            StudentAccount::query()->where('student_id', $user->id)->update(['email' => $email]);
        }

        if ($student) {
            $student->update([
                'nisn' => $nisn,
                'name' => $name,
                'class' => (string) $request->input('class', $student->class),
                'major' => (string) $request->input('major', $student->major),
                'achievements' => $request->has('achievements')
                    ? $this->jsonList($request->input('achievements'))
                    : $student->achievements,
            ]);
        }

        $updates = ['name' => $name];
        if ($pin !== '') {
            $updates['password'] = $pin;
        }
        $user->update($updates);
        $user->profileRecord?->update($this->profileStatusUpdates($request) + ['name' => $name]);
    }

    private function updateStaff(User $user, Request $request, string $targetRole): void
    {
        $email = strtolower(trim((string) $request->input('email', $user->email)));
        $password = (string) $request->input('password', '');

        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw $this->httpFail('Email wajib diisi dengan benar.');
        }
        if ($email !== $user->email && User::query()->where('email', $email)->exists()) {
            throw $this->httpFail('Email sudah terdaftar.');
        }
        if ($password !== '' && mb_strlen($password) < 6) {
            throw $this->httpFail('Password minimal 6 karakter.');
        }

        if ($targetRole === 'guru') {
            $this->updateGuruData($user, $request);
        } elseif ($targetRole === 'osis') {
            $this->updateOsisData($user, $request);
        }

        $this->applyStaffChanges($user, $email, $password, $targetRole, $request);
    }

    private function updateGuruData(User $user, Request $request): void
    {
        if (! $user->guru) {
            Guru::create([
                'id' => $user->id,
                'teacher_id' => $this->accounts->generateTeacherId(),
                'nip' => null,
                'nuptk' => null,
                'subject' => '',
                'position' => '',
                'achievements' => [],
                'certifications' => [],
            ]);
        }

        $guru = $user->guru;
        $nip = trim((string) $request->input('nip', $guru->nip ?? ''));
        $nuptk = trim((string) $request->input('nuptk', $guru->nuptk ?? ''));

        if ($nip !== '' && Guru::query()->where('nip', $nip)->where('id', '!=', $user->id)->exists()) {
            throw $this->httpFail('NIP sudah terdaftar.');
        }
        if ($nuptk !== '' && Guru::query()->where('nuptk', $nuptk)->where('id', '!=', $user->id)->exists()) {
            throw $this->httpFail('NUPTK sudah terdaftar.');
        }

        $guru->update([
            'nip' => $nip ?: null,
            'nuptk' => $nuptk ?: null,
            'subject' => (string) $request->input('subject', $guru->subject),
            'position' => (string) $request->input('position', $guru->position),
            'achievements' => $request->has('achievements')
                ? $this->jsonList($request->input('achievements'))
                : $guru->achievements,
            'certifications' => $request->has('certifications')
                ? $this->jsonList($request->input('certifications'))
                : $guru->certifications,
        ]);
    }

    private function updateOsisData(User $user, Request $request): void
    {
        if (! $user->osisAccount) {
            OsisAccount::create([
                'id' => $user->id,
                'member_id' => $this->accounts->generateMemberId(),
                'nisn' => null,
                'division' => '',
                'position' => '',
                'achievements' => [],
                'work_programs' => [],
            ]);
        }

        $account = $user->osisAccount;
        $nisn = trim((string) $request->input('nisn', $account->nisn ?? ''));

        if ($nisn !== '' && OsisAccount::query()->where('nisn', $nisn)->where('id', '!=', $user->id)->exists()) {
            throw $this->httpFail('NISN sudah terdaftar.');
        }

        $account->update([
            'nisn' => $nisn ?: null,
            'division' => (string) $request->input('division', $account->division),
            'position' => (string) $request->input('position', $account->position),
            'achievements' => $request->has('achievements')
                ? $this->jsonList($request->input('achievements'))
                : $account->achievements,
            'work_programs' => $request->has('work_programs')
                ? $this->jsonList($request->input('work_programs'))
                : $account->work_programs,
        ]);
    }

    private function applyStaffChanges(User $user, string $email, string $password, string $role, Request $request): void
    {
        $name = trim((string) $request->input('name', $user->name));

        $updates = ['name' => $name, 'email' => $email];
        if ($password !== '') {
            $updates['password'] = $password;
        }
        $user->update($updates);
        $user->profileRecord?->update($this->profileStatusUpdates($request) + [
            'role' => $role,
            'name' => $name,
            'email' => $email,
        ]);
    }

    // ------------------------------------------------------------------
    // Shared helpers
    // ------------------------------------------------------------------

    private function createUserWithProfile(string $id, string $name, string $email, string $password, string $role, Request $request): void
    {
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
            'role' => $role,
            'name' => $name,
            'email' => $email,
            'status' => $request->input('status', 'active') === 'inactive' ? 'inactive' : 'active',
            'must_change_password' => $request->boolean('must_change_password'),
            'updated_at' => now(),
        ]);
    }

    private function createStudentRecords(string $id, string $nisn, string $name, string $email, Request $request): void
    {
        Student::create([
            'id' => $id,
            'nisn' => $nisn,
            'name' => $name,
            'class' => (string) $request->input('class', ''),
            'major' => (string) $request->input('major', ''),
            'achievements' => $this->jsonList($request->input('achievements')),
        ]);

        StudentAccount::create([
            'id' => $id,
            'student_id' => $id,
            'email' => $email,
            'status' => 'active',
        ]);
    }

    private function profileStatusUpdates(Request $request): array
    {
        $updates = [];

        if ($request->has('status')) {
            $updates['status'] = $request->input('status') === 'inactive' ? 'inactive' : 'active';
        }

        if ($request->has('must_change_password')) {
            $updates['must_change_password'] = $request->boolean('must_change_password');
        }

        return $updates;
    }

    private function jsonList(mixed $value): array
    {
        if (is_array($value)) {
            return array_values($value);
        }

        if (is_string($value)) {
            $decoded = json_decode($value, true);
            return is_array($decoded) ? array_values($decoded) : [];
        }

        return [];
    }

    private function studentEmail(string $nisn): string
    {
        return 'nisn-'.$nisn.'@mading.smkn11.sch.id';
    }

    private function adminCount(): int
    {
        return User::query()->whereHas('profileRecord', fn ($q) => $q->where('role', 'admin'))->count();
    }

    private function loadAccount(string $id): User
    {
        return User::with(['profileRecord', 'student', 'guru', 'osisAccount'])->findOrFail($id);
    }

    private function payload(User $user): array
    {
        $profile = $user->profileRecord;

        return [
            'id' => $user->id,
            'email' => $user->email,
            'name' => $user->name,
            'role' => $profile?->role ?? 'applicant',
            'phone' => $profile?->phone ?? '',
            'status' => $profile?->status ?? 'active',
            'must_change_password' => (bool) ($profile?->must_change_password ?? false),
            'nisn' => $user->student?->nisn ?? '',
            'class' => $user->student?->class ?? '',
            'major' => $user->student?->major ?? '',
            'achievements' => $this->roleAchievements($user),
            'guru' => $user->guru ? [
                'nip' => $user->guru->nip ?? '',
                'nuptk' => $user->guru->nuptk ?? '',
                'teacher_id' => $user->guru->teacher_id ?? '',
                'subject' => $user->guru->subject ?? '',
                'position' => $user->guru->position ?? '',
                'certifications' => $user->guru->certifications ?? [],
            ] : null,
            'osis' => $user->osisAccount ? [
                'member_id' => $user->osisAccount->member_id ?? '',
                'nisn' => $user->osisAccount->nisn ?? '',
                'division' => $user->osisAccount->division ?? '',
                'position' => $user->osisAccount->position ?? '',
                'work_programs' => $user->osisAccount->work_programs ?? [],
            ] : null,
            'created_at' => $user->created_at?->toIso8601String(),
        ];
    }

    private function roleAchievements(User $user): array
    {
        if ($user->student) {
            return $user->student->achievements ?? [];
        }
        if ($user->guru) {
            return $user->guru->achievements ?? [];
        }
        if ($user->osisAccount) {
            return $user->osisAccount->achievements ?? [];
        }

        return [];
    }

    private function fail(string $message)
    {
        return response()->json(['error' => ['message' => $message]], 422);
    }

    private function httpFail(string $message): HttpException
    {
        return new HttpException(422, $message);
    }
}
