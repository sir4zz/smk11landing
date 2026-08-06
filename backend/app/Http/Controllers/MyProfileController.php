<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\AccountService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

/**
 * Self-service profile management. Every user (guru, siswa, OSIS, admin) can
 * only edit their own profile. Admins use the admin account API for others.
 */
class MyProfileController extends Controller
{
    public function __construct(protected AccountService $accounts)
    {
    }

    public function show(Request $request)
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(null, 401);
        }

        $user->load(['profileRecord', 'guru', 'osisAccount', 'student']);

        return response()->json(['data' => $this->accounts->profilePayload($user), 'error' => null]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['error' => ['message' => 'Tidak terautentikasi.']], 401);
        }

        $profile = $user->profileRecord;

        if (! $profile) {
            return response()->json(['error' => ['message' => 'Profil tidak ditemukan.']], 404);
        }

        $profileUpdates = [];

        foreach (['photo', 'bio', 'address', 'instagram', 'facebook', 'twitter', 'tiktok', 'youtube', 'linkedin', 'website', 'github'] as $field) {
            if ($request->has($field)) {
                $profileUpdates[$field] = trim((string) $request->input($field));
            }
        }

        if ($request->has('name')) {
            $name = trim((string) $request->input('name'));
            if (mb_strlen($name) < 2) {
                return $this->fail('Nama wajib diisi.');
            }
            $profileUpdates['name'] = $name;
            $user->update(['name' => $name]);
        }

        if ($request->has('phone')) {
            $profileUpdates['phone'] = trim((string) $request->input('phone'));
        }

        if ($request->has('email')) {
            $email = strtolower(trim((string) $request->input('email')));
            if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
                return $this->fail('Email wajib diisi dengan benar.');
            }
            if (User::query()->where('email', $email)->where('id', '!=', $user->id)->exists()) {
                return $this->fail('Email sudah digunakan akun lain.');
            }
            $user->update(['email' => $email]);
            $profileUpdates['email'] = $email;
        }

        if ($profileUpdates) {
            $profile->update($profileUpdates);
        }

        $role = $profile->role;

        if ($role === 'guru' && $user->guru) {
            $guruUpdates = [];
            foreach (['subject', 'position'] as $field) {
                if ($request->has($field)) {
                    $guruUpdates[$field] = trim((string) $request->input($field));
                }
            }
            if ($request->has('achievements')) {
                $guruUpdates['achievements'] = $this->jsonList($request->input('achievements'));
            }
            if ($request->has('certifications')) {
                $guruUpdates['certifications'] = $this->jsonList($request->input('certifications'));
            }
            if ($guruUpdates) {
                $user->guru->update($guruUpdates);
            }
        }

        if ($role === 'osis' && $user->osisAccount) {
            $osisUpdates = [];
            foreach (['division', 'position'] as $field) {
                if ($request->has($field)) {
                    $osisUpdates[$field] = trim((string) $request->input($field));
                }
            }
            if ($request->has('achievements')) {
                $osisUpdates['achievements'] = $this->jsonList($request->input('achievements'));
            }
            if ($request->has('work_programs')) {
                $osisUpdates['work_programs'] = $this->jsonList($request->input('work_programs'));
            }
            if ($osisUpdates) {
                $user->osisAccount->update($osisUpdates);
            }
        }

        if ($role === 'student' && $user->student) {
            $studentUpdates = [];
            foreach (['class', 'major'] as $field) {
                if ($request->has($field)) {
                    $studentUpdates[$field] = trim((string) $request->input($field));
                }
            }
            if ($request->has('achievements')) {
                $studentUpdates['achievements'] = $this->jsonList($request->input('achievements'));
            }
            if ($studentUpdates) {
                $user->student->update($studentUpdates);
            }
        }

        $user->load(['profileRecord', 'guru', 'osisAccount', 'student']);

        return response()->json(['data' => $this->accounts->profilePayload($user), 'error' => null]);
    }

    public function updatePassword(Request $request)
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['error' => ['message' => 'Tidak terautentikasi.']], 401);
        }

        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string'],
        ]);

        $minLength = $user->profileRecord?->role === 'student' ? 4 : 6;

        if (mb_strlen($data['new_password']) < $minLength) {
            return $this->fail('Password baru minimal '.$minLength.' karakter.');
        }

        if (! Hash::check($data['current_password'], $user->password)) {
            return $this->fail('Password saat ini salah.');
        }

        $user->update(['password' => Hash::make($data['new_password'])]);
        $user->profileRecord?->update(['must_change_password' => false]);

        return response()->json(['data' => ['must_change_password' => false], 'error' => null]);
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

    private function fail(string $message)
    {
        return response()->json(['error' => ['message' => $message]], 422);
    }
}
