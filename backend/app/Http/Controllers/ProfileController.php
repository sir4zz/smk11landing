<?php

namespace App\Http\Controllers;

use App\Models\Profile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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

        $profile = $profile->fresh();
        if ($user->student) {
            $student = $user->student->fresh();
            $profile->name = $student->name;
            $profile->phone = $student->phone;
            $profile->address = $student->address;
            $profile->photo = $student->foto;
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

        DB::transaction(function () use ($user, $profile, $payload) {
            if ($user->student) {
                $studentUpdates = [];
                foreach (['name', 'address'] as $field) {
                    if (isset($payload[$field])) $studentUpdates[$field] = $payload[$field];
                }
                if (isset($payload['phone'])) $studentUpdates['phone'] = $payload['phone'];
                if (isset($payload['photo'])) $studentUpdates['foto'] = $payload['photo'];
                if ($studentUpdates) {
                    $user->student->update($studentUpdates);
                    if (isset($studentUpdates['name'])) $user->update(['name' => $studentUpdates['name']]);
                }
            } else {
                if (isset($payload['phone'])) $profile->phone = $payload['phone'];
                if (isset($payload['name'])) $profile->name = $payload['name'];
                $profile->updated_at = now();
                $profile->save();
            }
        });

        return response()->json($profile);
    }
}
