<?php

namespace App\Http\Controllers;

use App\Models\Permission;
use App\Models\Role;
use App\Models\RolePermission;
use Illuminate\Http\Request;

class RolePermissionController extends Controller
{
    public function roles()
    {
        return response()->json(Role::query()->orderBy('slug', 'asc')->get());
    }

    public function permissions()
    {
        return response()->json(Permission::query()->orderBy('slug', 'asc')->get());
    }

    public function rolePermissions(string $roleId)
    {
        $ids = RolePermission::query()
            ->where('role_id', $roleId)
            ->pluck('permission_id');

        return response()->json($ids->map(fn ($id) => ['permission_id' => $id])->values());
    }

    public function syncRolePermissions(Request $request, string $roleId)
    {
        $role = Role::findOrFail($roleId);

        if ($role->slug === 'admin') {
            return response()->json(['error' => ['message' => 'Role admin tidak dapat diubah']], 403);
        }

        $payload = $request->all();
        $items = [];

        // Accept either [{role_id, permission_id}, ...] or {items: [...]} or a flat array.
        if (isset($payload['items']) && is_array($payload['items'])) {
            $items = $payload['items'];
        } elseif (is_array($payload) && array_key_exists(0, $payload)) {
            $items = $payload;
        } elseif (isset($payload['permission_ids']) && is_array($payload['permission_ids'])) {
            $items = array_map(fn ($pid) => ['role_id' => $roleId, 'permission_id' => $pid], $payload['permission_ids']);
        }

        // Delete-all + reinsert (replica of the frontend behavior).
        RolePermission::query()->where('role_id', $roleId)->delete();

        foreach ($items as $item) {
            $permId = $item['permission_id'] ?? $item ?? null;
            if (! $permId) {
                continue;
            }
            RolePermission::create([
                'role_id' => $roleId,
                'permission_id' => $permId,
            ]);
        }

        return response()->json(['data' => null, 'error' => null]);
    }
}
