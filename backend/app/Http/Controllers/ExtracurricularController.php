<?php

namespace App\Http\Controllers;

use App\Models\Extracurricular;
use Illuminate\Http\Request;
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
        $payload = $request->all();
        unset($payload['id'], $payload['created_at'], $payload['updated_at']);

        if (empty($payload['slug'])) {
            $payload['slug'] = $this->uniqueSlug($payload['name'] ?? 'ekstrakurikuler');
        }

        return response()->json(Extracurricular::create($payload), 201);
    }

    public function update(Request $request, string $id)
    {
        $row = Extracurricular::findOrFail($id);

        $payload = $request->all();
        unset($payload['id'], $payload['created_at'], $payload['updated_at']);

        if (empty($payload['slug']) && ! empty($payload['name'])) {
            $payload['slug'] = $this->uniqueSlug($payload['name'], $row->id);
        }

        $row->update($payload);

        return response()->json($row);
    }

    public function destroy(string $id)
    {
        Extracurricular::findOrFail($id)->delete();

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
}
