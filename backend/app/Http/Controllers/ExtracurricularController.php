<?php

namespace App\Http\Controllers;

use App\Models\Extracurricular;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ExtracurricularController extends Controller
{
    public function index(Request $request)
    {
        $query = Extracurricular::query()->where('status', 'published');
        if ($request->has('slug')) {
            $query->where('slug', $request->query('slug'));
        }

        $query->orderBy('name', 'asc');

        return response()->json($query->get());
    }

    public function show(string $slug)
    {
        $row = Extracurricular::query()
            ->where('slug', $slug)
            ->where('status', 'published')
            ->first();

        if (! $row) {
            return response()->json(null, 404);
        }

        return response()->json($row);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'short_description' => 'nullable|string|max:500',
            'full_description' => 'nullable|string',
            'logo' => 'nullable|string|max:500',
            'photo' => 'nullable|string|max:500',
            'advisor' => 'nullable|string|max:255',
            'schedule' => 'nullable|string|max:255',
            'place' => 'nullable|string|max:255',
            'achievements' => 'nullable|array',
            'achievements.*' => 'string',
            'documentation' => 'nullable|array',
            'documentation.*' => 'string',
            'gallery' => 'nullable|array',
            'gallery.*' => 'string',
            'status' => 'nullable|string|in:published,draft',
        ]);

        if (empty($validated['slug'])) {
            $validated['slug'] = $this->uniqueSlug($validated['name'] ?? 'ekstrakurikuler');
        }

        return response()->json(Extracurricular::create($validated), 201);
    }

    public function update(Request $request, string $id)
    {
        $row = Extracurricular::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'category' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'short_description' => 'nullable|string|max:500',
            'full_description' => 'nullable|string',
            'logo' => 'nullable|string|max:500',
            'photo' => 'nullable|string|max:500',
            'advisor' => 'nullable|string|max:255',
            'schedule' => 'nullable|string|max:255',
            'place' => 'nullable|string|max:255',
            'achievements' => 'nullable|array',
            'achievements.*' => 'string',
            'documentation' => 'nullable|array',
            'documentation.*' => 'string',
            'gallery' => 'nullable|array',
            'gallery.*' => 'string',
            'status' => 'nullable|string|in:published,draft',
        ]);

        if (empty($validated['slug']) && ! empty($validated['name'])) {
            $validated['slug'] = $this->uniqueSlug($validated['name'], $row->id);
        }

        $this->cleanupReplacedFiles($row, $validated);
        $row->update($validated);

        return response()->json($row);
    }

    public function destroy(string $id)
    {
        $row = Extracurricular::findOrFail($id);
        $this->deleteStoredFile($row->logo ?? null);
        $this->deleteStoredFile($row->photo ?? null);
        foreach (($row->documentation ?? []) as $u) {
            $this->deleteStoredFile(is_string($u) ? $u : null);
        }
        foreach (($row->gallery ?? []) as $u) {
            $this->deleteStoredFile(is_string($u) ? $u : null);
        }
        $row->delete();

        return response()->json(['data' => null, 'error' => null]);
    }

    protected function uniqueSlug(string $name, ?string $ignoreId = null): string
    {
        $base = Str::slug($name) ?: 'ekstrakurikuler';
        $slug = $base;
        $i = 2;
        $query = Extracurricular::query()->where('slug', $slug);
        if ($ignoreId) {
            $query->where('id', '!=', $ignoreId);
        }
        while ($query->exists()) {
            $slug = $base.'-'.$i;
            $i++;
        }

        return $slug;
    }

    private function cleanupReplacedFiles($row, array $payload): void
    {
        foreach (['logo', 'photo'] as $field) {
            if (! array_key_exists($field, $payload)) {
                continue;
            }
            $old = (string) ($row->{$field} ?? '');
            $new = (string) ($payload[$field] ?? '');
            if ($old !== '' && $old !== $new) {
                $this->deleteStoredFile($old);
            }
        }
        foreach (['documentation', 'gallery'] as $field) {
            if (! array_key_exists($field, $payload)) {
                continue;
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
