<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Models\User;
use App\Services\AccountService;
use App\Services\PermissionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(
        protected PermissionService $permissions,
        protected AccountService $accounts
    ) {
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'identifier' => ['nullable', 'string'],
            'email' => ['nullable', 'email'],
            'password' => ['required', 'string'],
        ]);

        $identifier = trim((string) ($data['identifier'] ?? $data['email'] ?? ''));

        if ($identifier === '') {
            return response()->json([
                'data' => null,
                'error' => ['message' => 'Email atau username wajib diisi.'],
            ], 422);
        }

        $user = $this->accounts->resolveUser($identifier);

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            return response()->json([
                'data' => null,
                'error' => ['message' => 'Email/Username atau password salah.'],
            ], 401);
        }

        $profile = $user->profileRecord;

        if ($profile && $profile->status === 'inactive') {
            return response()->json([
                'data' => null,
                'error' => ['message' => 'Akun dinonaktifkan. Hubungi admin sekolah.'],
            ], 403);
        }

        $request->session()->regenerate();
        Auth::login($user, false);

        return response()->json([
            'data' => [
                'user' => $this->userPayload($user),
                'role' => $profile?->role,
                'must_change_password' => (bool) ($profile?->must_change_password ?? false),
            ],
            'error' => null,
        ]);
    }

    public function register(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'name' => ['nullable', 'string', 'max:255'],
        ]);

        $user = User::create([
            'email' => strtolower($data['email']),
            'password' => Hash::make($data['password']),
            'name' => $data['name'] ?? '',
            'profile' => $data['name'] ? ['name' => $data['name']] : null,
        ]);

        Profile::create([
            'id' => $user->id,
            'role' => 'applicant',
            'name' => $data['name'] ?? null,
            'email' => $user->email,
            'updated_at' => now(),
        ]);

        Auth::login($user, false);
        $request->session()->regenerate();

        return response()->json([
            'data' => [
                'user' => $this->userPayload($user),
            ],
            'error' => null,
        ]);
    }

    public function logout(Request $request)
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['data' => null, 'error' => null]);
    }

    public function me(Request $request)
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['data' => null, 'error' => null], 401);
        }

        return response()->json([
            'data' => [
                'user' => $this->userPayload($user),
                'role' => $user->profileRecord?->role,
                'status' => $user->profileRecord?->status ?? 'active',
                'must_change_password' => (bool) ($user->profileRecord?->must_change_password ?? false),
                'permissions' => $this->permissions->permissionsForUser($user),
            ],
            'error' => null,
        ]);
    }

    public function permissions(Request $request)
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['data' => [], 'error' => null]);
        }

        return response()->json([
            'data' => $this->permissions->permissionsForUser($user),
            'error' => null,
        ]);
    }

    protected function userPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'email' => $user->email,
            'name' => $user->name,
        ];
    }
}
