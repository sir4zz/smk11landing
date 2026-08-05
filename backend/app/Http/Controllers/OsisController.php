<?php

namespace App\Http\Controllers;

use App\Models\Osis;
use App\Models\OsisActivity;
use App\Models\OsisMember;
use Illuminate\Http\Request;

class OsisController extends Controller
{
    // ---------- PROFILE ----------
    public function profile()
    {
        return response()->json(Osis::query()->orderBy('created_at')->first());
    }

    public function storeProfile(Request $request)
    {
        $payload = $request->all();
        unset($payload['id'], $payload['updated_at']);

        $osis = Osis::create($payload);

        return response()->json($osis, 201);
    }

    public function updateProfile(Request $request, string $id)
    {
        $osis = Osis::findOrFail($id);

        $payload = $request->all();
        unset($payload['id'], $payload['updated_at']);

        $osis->update($payload);

        return response()->json($osis);
    }

    // ---------- MEMBERS ----------
    public function members()
    {
        return response()->json(OsisMember::query()->orderBy('sort_order', 'asc')->get());
    }

    public function storeMember(Request $request)
    {
        $payload = $request->all();
        unset($payload['id'], $payload['created_at'], $payload['updated_at']);

        return response()->json(OsisMember::create($payload), 201);
    }

    public function updateMember(Request $request, string $id)
    {
        $member = OsisMember::findOrFail($id);

        $payload = $request->all();
        unset($payload['id'], $payload['created_at'], $payload['updated_at']);

        $member->update($payload);

        return response()->json($member);
    }

    public function destroyMember(string $id)
    {
        OsisMember::findOrFail($id)->delete();

        return response()->json(['data' => null, 'error' => null]);
    }

    // ---------- ACTIVITIES ----------
    public function activities()
    {
        return response()->json(OsisActivity::query()->orderBy('activity_date', 'desc')->get());
    }

    public function storeActivity(Request $request)
    {
        $payload = $request->all();
        unset($payload['id'], $payload['created_at'], $payload['updated_at']);

        return response()->json(OsisActivity::create($payload), 201);
    }

    public function updateActivity(Request $request, string $id)
    {
        $activity = OsisActivity::findOrFail($id);

        $payload = $request->all();
        unset($payload['id'], $payload['created_at'], $payload['updated_at']);

        $activity->update($payload);

        return response()->json($activity);
    }

    public function destroyActivity(string $id)
    {
        OsisActivity::findOrFail($id)->delete();

        return response()->json(['data' => null, 'error' => null]);
    }
}
