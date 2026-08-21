<?php

namespace App\Http\Controllers;

use App\Models\MadingCategory;
use App\Models\MadingPost;
use App\Services\MadingService;
use App\Services\PermissionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MadingController extends Controller
{
    public function __construct(
        protected MadingService $mading,
        protected PermissionService $permissions
    ) {
    }

    // ---------- CATEGORIES ----------
    public function categories()
    {
        return response()->json(MadingCategory::query()->orderBy('sort_order', 'asc')->get());
    }

    public function storeCategory(Request $request)
    {
        $payload = $request->all();
        unset($payload['id'], $payload['created_at']);

        if (empty($payload['slug'])) {
            $payload['slug'] = Str::slug($payload['name'] ?? 'kategori') ?: 'kategori';
        }

        return response()->json(MadingCategory::create($payload), 201);
    }

    public function updateCategory(Request $request, string $id)
    {
        $category = MadingCategory::findOrFail($id);

        $payload = $request->all();
        unset($payload['id'], $payload['created_at']);

        if (empty($payload['slug'])) {
            $payload['slug'] = Str::slug($payload['name'] ?? $category->name) ?: 'kategori';
        }

        $category->update($payload);

        return response()->json($category);
    }

    public function destroyCategory(string $id)
    {
        MadingCategory::findOrFail($id)->delete();

        return response()->json(['data' => null, 'error' => null]);
    }

    // ---------- POSTS ----------
    public function index(Request $request)
    {
        $user = $request->user();

        $status = $request->query('status');
        $authorId = $request->query('author_id');
        $categoryId = $request->query('category_id');

        $query = MadingPost::query()->with('category:id,name');

        // Visibility: published posts for everyone; non-published only for
        // the author or staff with mading.view.
        if (! $user || ! $this->permissions->hasPermission($user, 'mading.view')) {
            $query->where(function ($q) use ($user) {
                $q->where('status', 'published');
                if ($user) {
                    $q->orWhere('author_id', $user->id);
                }
            });
        }

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }
        if ($authorId) {
            $query->where('author_id', $authorId);
        }
        if ($categoryId) {
            $query->where('category_id', $categoryId);
        }

        if ($status === 'published') {
            $query->orderBy('published_at', 'desc')->orderBy('created_at', 'desc');
        } else {
            $query->orderBy('created_at', 'desc');
        }

        return response()->json($query->get());
    }

    public function show(Request $request, string $id)
    {
        $user = $request->user();

        $post = MadingPost::with('category:id,name')->find($id);

        if (! $post) {
            return response()->json(['error' => ['message' => 'Not Found']], 404);
        }

        // Visibility mirrors index(): published for everyone; own or staff
        // (mading.view) only when authenticated. Non-visible posts 404 so the
        // public cannot access unpublished content.
        $visible = $post->status === 'published'
            || ($user && $post->author_id === $user->id)
            || ($user && $this->permissions->hasPermission($user, 'mading.view'));

        if (! $visible) {
            return response()->json(['error' => ['message' => 'Not Found']], 404);
        }

        return response()->json($post);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['error' => ['message' => 'Unauthorized']], 401);
        }

        $data = $request->all();
        unset($data['id'], $data['created_at'], $data['updated_at'], $data['mading_categories'], $data['category']);

        if (($data['category_id'] ?? null) === '') {
            $data['category_id'] = null;
        }
        if (empty($data['status'])) {
            $data['status'] = 'draft';
        }

        try {
            $data = $this->mading->guardInsert($user, $data);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['error' => $e->errors()], 422);
        }

        $post = MadingPost::create($data);

        return response()->json(MadingPost::with('category:id,name')->find($post->id), 201);
    }

    public function update(Request $request, string $id)
    {
        $user = $request->user();
        $post = MadingPost::findOrFail($id);

        if (! $user) {
            return response()->json(['error' => ['message' => 'Unauthorized']], 401);
        }

        $data = $request->all();
        unset($data['id'], $data['created_at'], $data['updated_at'], $data['mading_categories'], $data['category']);

        if (($data['category_id'] ?? null) === '') {
            $data['category_id'] = null;
        }

        try {
            $data = $this->mading->guardUpdate($user, $post, $data);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['error' => $e->errors()], 422);
        }

        $this->cleanupReplacedMadingFiles($post, $data);
        $post->update($data);

        return response()->json(MadingPost::with('category:id,name')->find($post->id));
    }

    public function destroy(Request $request, string $id)
    {
        $user = $request->user();
        $post = MadingPost::findOrFail($id);

        $isOwnerDraft = $post->author_id === $user?->id && in_array($post->status, ['draft', 'rejected'], true);
        $canDelete = $isOwnerDraft || $this->permissions->hasPermission($user, 'mading.delete');

        if (! $canDelete) {
            return response()->json(['error' => ['message' => 'Forbidden']], 403);
        }

        $this->deleteStoredFile($post->cover_image ?? null);
        foreach ($this->extractImageUrls($post->images) as $url) {
            $this->deleteStoredFile($url);
        }
        $post->delete();

        return response()->json(['data' => null, 'error' => null]);
    }

    // ---------- WORKFLOW ----------
    public function submit(Request $request, string $id)
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['error' => ['message' => 'Unauthorized']], 401);
        }

        try {
            $this->mading->submit($user, $id);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['error' => $e->errors()], 422);
        }

        return response()->json(['data' => null, 'error' => null]);
    }

    public function review(Request $request, string $id)
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['error' => ['message' => 'Unauthorized']], 401);
        }

        $data = $request->validate([
            'action' => ['required', 'in:approve,reject'],
            'feedback' => ['nullable', 'string'],
        ]);

        try {
            $this->mading->review($user, $id, $data['action'], $data['feedback'] ?? '');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['error' => $e->errors()], 422);
        }

        return response()->json(['data' => null, 'error' => null]);
    }

    public function publish(Request $request, string $id)
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['error' => ['message' => 'Unauthorized']], 401);
        }

        try {
            $this->mading->publish($user, $id);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['error' => $e->errors()], 422);
        }

        return response()->json(['data' => null, 'error' => null]);
    }

    private function cleanupReplacedMadingFiles(MadingPost $post, array $data): void
    {
        if (array_key_exists('cover_image', $data)) {
            $old = (string) ($post->cover_image ?? '');
            $new = (string) ($data['cover_image'] ?? '');
            if ($old !== '' && $old !== $new) {
                $this->deleteStoredFile($old);
            }
        }
        if (array_key_exists('images', $data)) {
            $oldUrls = $this->extractImageUrls($post->images);
            $newUrls = $this->extractImageUrls($data['images'] ?? null);
            foreach (array_diff($oldUrls, $newUrls) as $url) {
                $this->deleteStoredFile($url);
            }
        }
    }

    private function extractImageUrls(mixed $images): array
    {
        if (empty($images)) {
            return [];
        }
        $arr = is_string($images) ? json_decode($images, true) : $images;
        if (! is_array($arr)) {
            return is_string($images) && str_starts_with($images, '/storage/') ? [$images] : [];
        }
        $out = [];
        foreach ($arr as $item) {
            if (is_string($item) && str_starts_with($item, '/storage/')) {
                $out[] = $item;
            } elseif (is_array($item)) {
                $u = $item['image'] ?? $item['url'] ?? $item['src'] ?? null;
                if (is_string($u) && str_starts_with($u, '/storage/')) {
                    $out[] = $u;
                }
            }
        }
        return $out;
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
