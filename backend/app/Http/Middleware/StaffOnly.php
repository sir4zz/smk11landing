<?php

namespace App\Http\Middleware;

use App\Services\PermissionService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class StaffOnly
{
    public function __construct(protected PermissionService $permissions)
    {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $this->permissions->isStaff($user)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return $next($request);
    }
}
