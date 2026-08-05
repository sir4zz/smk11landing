<?php

namespace App\Http\Controllers;

use App\Models\MadingCategory;
use App\Models\MadingPost;
use App\Services\MadingService;
use App\Services\PermissionService;
use Illuminate\Http\Request;
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
            $query->orderBy('published_at', 'desc');
        } else {
            $query->orderBy('created_at', 'desc');
        }

        return response()->json($query->get());
    }

    public function show(string $id)
    {
        $post = MadingPost::with('category:id,name')->findOrFail($id);

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
}
