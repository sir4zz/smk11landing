<?php

namespace App\Http\Controllers;

use App\Models\Osis;
use App\Models\OsisActivity;
use App\Models\OsisMember;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class OsisController extends Controller
{
    // ---------- PROFILE ----------
    public function profile()
    {
        return response()->json(Osis::query()->orderBy('updated_at')->first());
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

        $this->cleanupReplacedFiles($osis, $payload, ['logo']);
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

        $this->cleanupReplacedFiles($member, $payload, ['photo']);
        $member->update($payload);

        return response()->json($member);
    }

    public function destroyMember(string $id)
    {
        $member = OsisMember::findOrFail($id);
        $this->deleteStoredFile($member->photo ?? null);
        $member->delete();

        return response()->json(['data' => null, 'error' => null]);
    }

    // ---------- ACTIVITIES ----------
    public function activities()
    {
        return response()->json(OsisActivity::query()->where('status', 'published')->orderBy('activity_date', 'desc')->get());
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

        $this->cleanupReplacedFiles($activity, $payload, ['photo']);
        $activity->update($payload);

        return response()->json($activity);
    }

    public function destroyActivity(string $id)
    {
        $activity = OsisActivity::findOrFail($id);
        $this->deleteStoredFile($activity->photo ?? null);
        $activity->delete();

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

    private function deleteStoredFile(?string $url): void
    {
        if (empty($url)) {
            return;
        }
        $path = parse_url($url, PHP_URL_PATH) ?? $url;
        $prefix = '/storage/';
        if (str_starts_with($path, $prefix)) {
            $path = substr($path, strlen($prefix));
        } else {
            if (! str_starts_with($url, '/storage/')) {
                return;
            }
            $path = ltrim($path, '/');
        }
        if ($path !== '') {
            Storage::disk('public')->delete($path);
        }
    }
}
