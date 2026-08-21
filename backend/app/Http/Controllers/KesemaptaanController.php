<?php

namespace App\Http\Controllers;

use App\Models\Kesemaptaan;
use App\Models\KesemaptaanAchievement;
use App\Models\KesemaptaanActivity;
use App\Models\KesemaptaanGallery;
use App\Models\KesemaptaanInstructor;
use App\Models\KesemaptaanSchedule;
use App\Models\KesemaptaanVideo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

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

        $this->cleanupReplacedFiles($row, $payload, ['photo', 'hero_image']);
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

        $this->cleanupReplacedFiles($row, $payload, ['photo']);
        $this->cleanupReplacedArrayFiles($row, $payload, 'documentation');
        $row->update($payload);

        return response()->json($row);
    }

    public function destroyActivity(string $id)
    {
        $row = KesemaptaanActivity::findOrFail($id);
        $this->deleteStoredFile($row->photo ?? null);
        foreach (($row->documentation ?? []) as $u) {
            $this->deleteStoredFile(is_string($u) ? $u : null);
        }
        $row->delete();

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

        $this->cleanupReplacedFiles($row, $payload, ['photo']);
        $row->update($payload);

        return response()->json($row);
    }

    public function destroyInstructor(string $id)
    {
        $row = KesemaptaanInstructor::findOrFail($id);
        $this->deleteStoredFile($row->photo ?? null);
        $row->delete();

        return response()->json(['data' => null, 'error' => null]);
    }

    // ---------- ACHIEVEMENTS ----------
    public function achievements()
    {
        return response()->json(KesemaptaanAchievement::query()->get());
    }

    // ---------- GALLERY (dokumentasi foto) ----------
    public function gallery()
    {
        return response()->json(KesemaptaanGallery::query()->orderBy('sort_order', 'asc')->orderBy('created_at', 'asc')->get());
    }

    // ---------- VIDEOS (YouTube) ----------
    public function videos()
    {
        return response()->json(KesemaptaanVideo::query()->orderBy('sort_order', 'asc')->orderBy('created_at', 'asc')->get());
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

        $this->cleanupReplacedArrayFiles($row, $payload, 'documentation');
        $row->update($payload);

        return response()->json($row);
    }

    public function destroyAchievement(string $id)
    {
        $row = KesemaptaanAchievement::findOrFail($id);
        foreach (($row->documentation ?? []) as $u) {
            $this->deleteStoredFile(is_string($u) ? $u : null);
        }
        $row->delete();

        return response()->json(['data' => null, 'error' => null]);
    }

    private function cleanupReplacedFiles($row, array $payload, array $fields): void
    {
        foreach ($fields as $field) {
            if (! array_key_exists($field, $payload)) {
                continue;
            }
            $old = (string) ($row->{$field} ?? '');
            $new = (string) ($payload[$field] ?? '');
            if ($old !== '' && $old !== $new) {
                $this->deleteStoredFile($old);
            }
        }
    }

    private function cleanupReplacedArrayFiles($row, array $payload, string $field): void
    {
        if (! array_key_exists($field, $payload)) {
            return;
        }
        $old = $row->{$field} ?? [];
        $new = $payload[$field] ?? [];
        if (! is_array($old)) {
            $old = [];
        }
        if (! is_array($new)) {
            $new = [];
        }
        foreach (array_diff($old, $new) as $u) {
            $this->deleteStoredFile(is_string($u) ? $u : null);
        }
    }

    private function deleteStoredFile(?string $url): void
    {
        if (empty($url) || ! str_starts_with($url, '/storage/')) {
            return;
        }
        $path = parse_url($url, PHP_URL_PATH) ?? $url;
        $prefix = '/storage/';
        if (str_starts_with($path, $prefix)) {
            $path = substr($path, strlen($prefix));
        } else {
            $path = ltrim($path, '/');
        }
        if ($path !== '') {
            Storage::disk('public')->delete($path);
        }
    }
}
