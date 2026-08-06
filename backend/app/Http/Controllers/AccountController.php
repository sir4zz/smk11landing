<?php

namespace App\Http\Controllers;

use App\Models\Profile;
use App\Models\Student;
use App\Models\StudentAccount;
use App\Models\User;
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

    public function index(Request $request)
    {
        $query = User::query()
            ->with(['profileRecord', 'student'])
            ->whereHas('profileRecord', fn ($q) => $q->whereIn('role', self::MANAGED_ROLES));

        if ($request->has('role') && in_array($request->query('role'), self::MANAGED_ROLES, true)) {
            $query->whereHas('profileRecord', fn ($q) => $q->where('role', $request->query('role')));
        }

        if ($request->filled('search')) {
            $term = '%'.trim((string) $request->query('search')).'%';
            $query->where(function ($q) use ($term) {
                $q->where('email', 'like', $term)->orWhere('name', 'like', $term);
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

        $this->createUserWithProfile($id, $name, $email, $password, $role);
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

        $this->createUserWithProfile($id, $name, $email, $pin, 'student');
        $this->createStudentRecords($id, $nisn, $name, $email, $request);
    }

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
            ]);
        }

        $updates = ['name' => $name];
        if ($pin !== '') {
            $updates['password'] = $pin;
        }
        $user->update($updates);
        $user->profileRecord?->update(['name' => $name]);
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

        $this->applyStaffChanges($user, $email, $password, $targetRole, $request);
    }

    private function applyStaffChanges(User $user, string $email, string $password, string $role, Request $request): void
    {
        $name = trim((string) $request->input('name', $user->name));

        $updates = ['name' => $name, 'email' => $email];
        if ($password !== '') {
            $updates['password'] = $password;
        }
        $user->update($updates);
        $user->profileRecord?->update(['role' => $role, 'name' => $name, 'email' => $email]);
    }

    private function createUserWithProfile(string $id, string $name, string $email, string $password, string $role): void
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
        ]);

        StudentAccount::create([
            'id' => $id,
            'student_id' => $id,
            'email' => $email,
            'status' => 'active',
        ]);
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
        return User::with(['profileRecord', 'student'])->findOrFail($id);
    }

    private function payload(User $user): array
    {
        return [
            'id' => $user->id,
            'email' => $user->email,
            'name' => $user->name,
            'role' => $user->profileRecord?->role ?? 'applicant',
            'phone' => $user->profileRecord?->phone ?? '',
            'nisn' => $user->student?->nisn ?? '',
            'class' => $user->student?->class ?? '',
            'major' => $user->student?->major ?? '',
            'created_at' => $user->created_at?->toIso8601String(),
        ];
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
