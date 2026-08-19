<?php

namespace App\Http\Controllers;

use App\Services\PermissionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class ContentCrudController extends Controller
{
    private const PUBLIC_CACHE_TTL = 30;
    private const PUBLIC_LIST_LIMIT = 100;

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
            if (in_array($key, $allowed, true) && is_scalar($value) && $value !== '' && $value !== null) {
                $query->where($key, $value);
            }
        }

        $slug = $request->query('slug');
        if (is_scalar($slug) && $slug !== '') {
            $query->where('slug', $slug);
        }

        $order = $request->query('order');
        if (is_string($order)) {
            [$col, $dir] = explode('|', $order) + [null, null];
            if ($col && in_array($col, $allowed, true)) {
                $query->orderBy($col, $dir === 'desc' ? 'desc' : 'asc');
            }
        }

        $limit = filter_var($request->query('limit'), FILTER_VALIDATE_INT, [
            'options' => ['min_range' => 1],
        ]);
        $limit = min($limit ?: self::PUBLIC_LIST_LIMIT, self::PUBLIC_LIST_LIMIT);
        $query->select(array_merge(['id'], $allowed))->limit($limit);

        $parameters = array_filter([
            'filters' => array_intersect_key($request->query(), array_flip($allowed)),
            'slug' => $slug,
            'order' => $order,
            'limit' => $limit,
        ], static fn ($value) => $value !== null && $value !== []);
        $version = Cache::get($this->contentCacheVersionKey($type), 1);
        $cacheKey = 'public:content:'.$type.':'.$version.':'.sha1((string) json_encode($parameters));

        return response()->json(Cache::remember(
            $cacheKey,
            now()->addSeconds(self::PUBLIC_CACHE_TTL),
            static fn () => $query->get(),
        ));
    }

    public function show(Request $request, string $slug)
    {
        $type = (string) $request->route('type');
        $model = $this->resolveModel($type);

        $version = Cache::get($this->contentCacheVersionKey($type), 1);
        $cacheKey = 'public:content:'.$type.':'.$version.':show:'.sha1($slug);
        $row = Cache::remember(
            $cacheKey,
            now()->addSeconds(self::PUBLIC_CACHE_TTL),
            static fn () => $model::query()->select(array_merge(['id'], (new $model)->getFillable()))
                ->where('slug', $slug)->first(),
        );

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

        if (in_array($type, ['news', 'programs'], true)) {
            $name = $type === 'programs'
                ? ($payload['short_name'] ?? $payload['name'] ?? 'untitled')
                : ($payload['title'] ?? 'untitled');
            $payload['slug'] = $this->uniqueSlug($model, $name);
        }

        $row = $model::create($payload);
        $this->invalidatePublicCache($type);

        return response()->json($row, 201);
    }

    public function update(Request $request, string $type, string $id)
    {
        $model = $this->resolveModel($type);

        $row = $model::findOrFail($id);

        $payload = $request->all();
        unset($payload['id'], $payload['created_at'], $payload['updated_at']);

        if (in_array($type, ['news', 'programs'], true)) {
            $name = $type === 'programs'
                ? ($payload['short_name'] ?? $payload['name'] ?? $row->short_name ?? $row->name ?? 'untitled')
                : ($payload['title'] ?? $row->title ?? 'untitled');
            $payload['slug'] = $this->uniqueSlug($model, $name, $row->id);
        }

        $row->update($payload);
        $this->invalidatePublicCache($type);

        return response()->json($row);
    }

    public function destroy(string $type, string $id)
    {
        $model = $this->resolveModel($type);

        $row = $model::findOrFail($id);
        $row->delete();
        $this->invalidatePublicCache($type);

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

    protected function contentCacheVersionKey(string $type): string
    {
        return 'public:content:version:'.$type;
    }

    protected function invalidatePublicCache(string $type): void
    {
        Cache::add($this->contentCacheVersionKey($type), 1);
        Cache::increment($this->contentCacheVersionKey($type));

        if (in_array($type, ['programs', 'staff', 'education-staff'], true)) {
            Cache::forget(StatsController::CACHE_KEY);
        }
    }

    protected function uniqueSlug(string $model, string $name, ?string $ignoreId = null): string
    {
        $base = Str::slug($name);
        $slug = $base ?: 'item';
        $i = 2;
        while ($model::query()->where('slug', $slug)->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))->exists()) {
            $slug = $base.'-'.$i;
            $i++;
        }

        return $slug;
    }
}
