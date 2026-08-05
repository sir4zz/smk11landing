<?php

namespace App\Http\Controllers;

use App\Models\Profile;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function show(Request $request, string $id)
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(null, 401);
        }

        // RLS replica: profiles are publicly readable, but only expose the
        // requester's own row or rows that are safe to expose.
        $profile = Profile::query()->where('id', $id)->first();

        if (! $profile) {
            return response()->json(null, 404);
        }

        if ($profile->id !== $user->id && ! in_array($profile->role, ['admin', 'guru', 'osis', 'student'], true)) {
            return response()->json(null, 403);
        }

        return response()->json($profile);
    }

    public function update(Request $request, string $id)
    {
        $user = $request->user();

        if (! $user || $user->id !== $id) {
            return response()->json(['error' => ['message' => 'Forbidden']], 403);
        }

        $profile = Profile::query()->where('id', $id)->firstOrFail();

        $payload = $request->all();
        unset($payload['id'], $payload['role']);

        if (isset($payload['phone'])) {
            $profile->phone = $payload['phone'];
        }
        if (isset($payload['name'])) {
            $profile->name = $payload['name'];
        }
        $profile->updated_at = now();
        $profile->save();

        return response()->json($profile);
    }
}
