<?php

namespace App\Services;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Cache;

class PermissionService
{
    public const STAFF_ROLES = ['admin', 'operator_sekolah', 'guru', 'osis', 'bkk'];

    /**
     * Replica of public.has_permission(p_perm):
     * - role 'admin' -> true
     * - no role -> false
     * - otherwise check role_permissions join.
     */
    public function hasPermission(?User $user, string $permission): bool
    {
        if (! $user) {
            return false;
        }

        $role = $user->profileRecord?->role;

        if ($role === 'admin') {
            return true;
        }

        if (! $role) {
            return false;
        }

        return $this->roleHasPermission($role, $permission);
    }

    /**
     * Replica of public.get_my_permissions():
     * - admin -> all permission slugs
     * - no role -> []
     * - otherwise slugs of the user's role.
     *
     * @return string[]
     */
    public function permissionsForUser(?User $user): array
    {
        if (! $user) {
            return [];
        }

        $role = $user->profileRecord?->role;

        if ($role === 'admin') {
            return Permission::query()->pluck('slug')->all();
        }

        if (! $role) {
            return [];
        }

        return $this->permissionsForRole($role);
    }

    /**
     * @return string[]
     */
    public function permissionsForRole(string $roleSlug): array
    {
        $role = Role::query()->where('slug', $roleSlug)->first();

        if (! $role) {
            return [];
        }

        return $role->permissions()->pluck('permissions.slug')->all();
    }

    /**
     * @return string[]
     */
    public function rolesForUser(User $user): array
    {
        $role = $user->profileRecord?->role;

        return $role ? [$role] : [];
    }

    public function isAdmin(?User $user): bool
    {
        return $user?->profileRecord?->role === 'admin';
    }

    public function isStaff(?User $user): bool
    {
        return in_array($user?->profileRecord?->role, self::STAFF_ROLES, true);
    }

    public function isStudent(?User $user): bool
    {
        return $user?->profileRecord?->role === 'student';
    }

    public function isGuru(?User $user): bool
    {
        return $user?->profileRecord?->role === 'guru';
    }

    protected function roleHasPermission(string $roleSlug, string $permission): bool
    {
        return in_array($permission, $this->permissionsForRole($roleSlug), true);
    }
}
