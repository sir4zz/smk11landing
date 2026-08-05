<?php

namespace App\Http\Controllers;

use App\Services\PermissionService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ContentCrudController extends Controller
{
    protected array $models = [
        'news' => \App\Models\News::class,
        'programs' => \App\Models\Program::class,
        'facilities' => \App\Models\Facility::class,
        'staff' => \App\Models\Staff::class,
        'achievements' => \App\Models\Achievement::class,
        'teacher-activities' => \App\Models\TeacherActivity::class,
        'education-staff' => \App\Models\EducationStaff::class,
    ];

    public function __construct(protected PermissionService $permissions)
    {
    }

    public function index(Request $request, string $type)
    {
        $model = $this->resolveModel($type);

        $query = $model::query();

        // Generic filters from the compat layer: ?col=value, ?order=col|asc|desc, ?limit=N
        $allowed = $this->fillableColumns($model);
        foreach ($request->query() as $key => $value) {
            if ($key === 'order' || $key === 'limit' || $key === 'slug') {
                continue;
            }
            if (in_array($key, $allowed, true) && $value !== '' && $value !== null) {
                $query->where($key, $value);
            }
        }

        if ($request->has('slug')) {
            $query->where('slug', $request->query('slug'));
        }

        if ($request->has('order')) {
            [$col, $dir] = explode('|', (string) $request->query('order')) + [null, null];
            if ($col && in_array($col, $allowed, true)) {
                $query->orderBy($col, $dir === 'desc' ? 'desc' : 'asc');
            }
        }

        if ($request->has('limit')) {
            $query->limit((int) $request->query('limit'));
        }

        return response()->json($query->get());
    }

    public function show(Request $request, string $type, string $slug)
    {
        $model = $this->resolveModel($type);

        $row = $model::query()->where('slug', $slug)->first();

        if (! $row) {
            return response()->json(null, 404);
        }

        return response()->json($row);
    }

    public function store(Request $request, string $type)
    {
        $model = $this->resolveModel($type);

        $payload = $request->all();
        unset($payload['id'], $payload['created_at'], $payload['updated_at']);

        // Auto-slug for news/programs if missing.
        if (in_array($type, ['news', 'programs'], true) && empty($payload['slug'])) {
            $name = $payload['name'] ?? $payload['title'] ?? 'untitled';
            $payload['slug'] = $this->uniqueSlug($model, $name);
        }

        $row = $model::create($payload);

        return response()->json($row, 201);
    }

    public function update(Request $request, string $type, string $id)
    {
        $model = $this->resolveModel($type);

        $row = $model::findOrFail($id);

        $payload = $request->all();
        unset($payload['id'], $payload['created_at'], $payload['updated_at']);

        $row->update($payload);

        return response()->json($row);
    }

    public function destroy(string $type, string $id)
    {
        $model = $this->resolveModel($type);

        $row = $model::findOrFail($id);
        $row->delete();

        return response()->json(['data' => null, 'error' => null]);
    }

    protected function resolveModel(string $type): string
    {
        if (! isset($this->models[$type])) {
            abort(404);
        }

        return $this->models[$type];
    }

    protected function fillableColumns(string $model): array
    {
        return (new $model)->getFillable();
    }

    protected function uniqueSlug(string $model, string $name): string
    {
        $base = Str::slug($name);
        $slug = $base ?: 'item';
        $i = 2;
        while ($model::query()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$i;
            $i++;
        }

        return $slug;
    }
}
