<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Models\User;
use App\Services\PermissionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(protected PermissionService $permissions)
    {
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt($credentials, false)) {
            return response()->json([
                'data' => null,
                'error' => ['message' => 'Email atau password salah.'],
            ], 401);
        }

        $request->session()->regenerate();

        $user = Auth::user();

        return response()->json([
            'data' => [
                'user' => $this->userPayload($user),
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
