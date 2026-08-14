<?php

namespace App\Http\Controllers;

use App\Models\Kesemaptaan;
use App\Models\KesemaptaanAchievement;
use App\Models\KesemaptaanActivity;
use App\Models\KesemaptaanInstructor;
use App\Models\KesemaptaanSchedule;
use Illuminate\Http\Request;

class KesemaptaanController extends Controller
{
    // ---------- PROFILE ----------
    public function profile()
    {
        return response()->json(Kesemaptaan::query()->orderBy('created_at')->first());
    }

    public function storeProfile(Request $request)
    {
        $payload = $request->all();
        unset($payload['id'], $payload['updated_at']);

        return response()->json(Kesemaptaan::create($payload), 201);
    }

    public function updateProfile(Request $request, string $id)
    {
        $row = Kesemaptaan::findOrFail($id);

        $payload = $request->all();
        unset($payload['id'], $payload['updated_at']);

        $row->update($payload);

        return response()->json($row);
    }

    // ---------- ACTIVITIES ----------
    public function activities()
    {
        return response()->json(KesemaptaanActivity::query()->where('status', 'published')->orderBy('activity_date', 'desc')->get());
    }

    public function storeActivity(Request $request)
    {
        $payload = $request->all();
        unset($payload['id'], $payload['created_at'], $payload['updated_at']);

        return response()->json(KesemaptaanActivity::create($payload), 201);
    }

    public function updateActivity(Request $request, string $id)
    {
        $row = KesemaptaanActivity::findOrFail($id);

        $payload = $request->all();
        unset($payload['id'], $payload['created_at'], $payload['updated_at']);

        $row->update($payload);

        return response()->json($row);
    }

    public function destroyActivity(string $id)
    {
        KesemaptaanActivity::findOrFail($id)->delete();

        return response()->json(['data' => null, 'error' => null]);
    }

    // ---------- SCHEDULES ----------
    public function schedules()
    {
        return response()->json(KesemaptaanSchedule::query()->get());
    }

    public function storeSchedule(Request $request)
    {
        $payload = $request->all();
        unset($payload['id'], $payload['created_at']);

        return response()->json(KesemaptaanSchedule::create($payload), 201);
    }

    public function updateSchedule(Request $request, string $id)
    {
        $row = KesemaptaanSchedule::findOrFail($id);

        $payload = $request->all();
        unset($payload['id'], $payload['created_at']);

        $row->update($payload);

        return response()->json($row);
    }

    public function destroySchedule(string $id)
    {
        KesemaptaanSchedule::findOrFail($id)->delete();

        return response()->json(['data' => null, 'error' => null]);
    }

    // ---------- INSTRUCTORS ----------
    public function instructors()
    {
        return response()->json(KesemaptaanInstructor::query()->orderBy('sort_order', 'asc')->get());
    }

    public function storeInstructor(Request $request)
    {
        $payload = $request->all();
        unset($payload['id'], $payload['created_at']);

        return response()->json(KesemaptaanInstructor::create($payload), 201);
    }

    public function updateInstructor(Request $request, string $id)
    {
        $row = KesemaptaanInstructor::findOrFail($id);

        $payload = $request->all();
        unset($payload['id'], $payload['created_at']);

        $row->update($payload);

        return response()->json($row);
    }

    public function destroyInstructor(string $id)
    {
        KesemaptaanInstructor::findOrFail($id)->delete();

        return response()->json(['data' => null, 'error' => null]);
    }

    // ---------- ACHIEVEMENTS ----------
    public function achievements()
    {
        return response()->json(KesemaptaanAchievement::query()->get());
    }

    public function storeAchievement(Request $request)
    {
        $payload = $request->all();
        unset($payload['id'], $payload['created_at']);

        return response()->json(KesemaptaanAchievement::create($payload), 201);
    }

    public function updateAchievement(Request $request, string $id)
    {
        $row = KesemaptaanAchievement::findOrFail($id);

        $payload = $request->all();
        unset($payload['id'], $payload['created_at']);

        $row->update($payload);

        return response()->json($row);
    }

    public function destroyAchievement(string $id)
    {
        KesemaptaanAchievement::findOrFail($id)->delete();

        return response()->json(['data' => null, 'error' => null]);
    }
}
