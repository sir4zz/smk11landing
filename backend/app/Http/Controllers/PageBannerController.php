<?php

namespace App\Http\Controllers;

use App\Models\PageBanner;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PageBannerController extends Controller
{
    // ------------------------------------------------------------------
    // PUBLIC — fetch banner by page_key
    // ------------------------------------------------------------------

    public function show(string $pageKey)
    {
        $banner = PageBanner::query()
            ->where('page_key', $pageKey)
            ->where('is_active', true)
            ->first();

        return response()->json(['data' => $banner, 'error' => null]);
    }

    public function index()
    {
        $banners = PageBanner::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        return response()->json(['data' => $banners, 'error' => null]);
    }

    // ------------------------------------------------------------------
    // STAFF / ADMIN — full CRUD
    // ------------------------------------------------------------------

    public function adminIndex(Request $request)
    {
        $query = PageBanner::query();

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('page_key', 'like', "%{$search}%")
                    ->orWhere('title', 'like', "%{$search}%");
            });
        }

        $query->orderBy('sort_order')->orderByDesc('created_at');

        return response()->json(['data' => $query->get(), 'error' => null]);
    }

    public function store(Request $request)
    {
        $payload = $this->validatedPayload($request);

        if (empty($payload['page_key'])) {
            return response()->json(['data' => null, 'error' => ['message' => 'Page key wajib diisi.']], 422);
        }

        $existing = PageBanner::where('page_key', $payload['page_key'])->first();
        if ($existing) {
            return response()->json(['data' => null, 'error' => ['message' => 'Page key sudah digunakan. Gunakan updateinstead.']], 422);
        }

        $image = $this->resolveImage($request);
        if ($image !== '') {
            $payload['image'] = $image;
        }

        $banner = PageBanner::create($payload);

        return response()->json(['data' => $banner->fresh(), 'error' => null], 201);
    }

    public function update(Request $request, string $id)
    {
        $banner = PageBanner::findOrFail($id);

        $payload = $this->validatedPayload($request);

        $image = $this->resolveImage($request);
        if ($image !== '' && $image !== $banner->image) {
            $this->deleteFileFromUrl($banner->image);
            $payload['image'] = $image;
        }

        if (! empty($payload)) {
            $banner->update($payload);
        }

        return response()->json(['data' => $banner->fresh(), 'error' => null]);
    }

    public function destroy(string $id)
    {
        $banner = PageBanner::findOrFail($id);

        $this->deleteFileFromUrl($banner->image);
        $banner->delete();

        return response()->json(['data' => null, 'error' => null]);
    }

    // ------------------------------------------------------------------
    // HELPERS
    // ------------------------------------------------------------------

    protected function validatedPayload(Request $request): array
    {
        $data = $request->all();

        $rules = [
            'page_key' => 'nullable|string',
            'title' => 'nullable|string',
            'subtitle' => 'nullable|string',
            'is_active' => 'nullable|boolean',
            'sort_order' => 'nullable|integer',
        ];

        $validated = $request->validate($rules);

        $payload = [];
        foreach (array_keys($rules) as $field) {
            if (array_key_exists($field, $data)) {
                $payload[$field] = $validated[$field] ?? null;
            }
        }

        if (array_key_exists('is_active', $payload)) {
            $payload['is_active'] = ! empty($payload['is_active']);
        }
        if (array_key_exists('sort_order', $payload)) {
            $payload['sort_order'] = (int) ($payload['sort_order'] ?? 0);
        }

        return $payload;
    }

    protected function resolveImage(Request $request): string
    {
        if ($request->hasFile('image')) {
            $request->validate([
                'image' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:10240'],
            ]);

            return $this->storeFile($request->file('image'));
        }

        $image = $request->input('image');
        if (is_string($image) && $image !== '') {
            return $image;
        }

        return '';
    }

    protected function storeFile($file): string
    {
        $directory = 'page-banners/'.now()->format('Y/m');
        $name = uniqid().'-'.Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)).'.'.$file->getClientOriginalExtension();
        Storage::disk('public')->putFileAs($directory, $file, $name);

        return '/storage/'.$directory.'/'.$name;
    }

    protected function deleteFileFromUrl(string $url): void
    {
        if (empty($url)) {
            return;
        }
        $prefix = '/storage/';
        if (str_starts_with($url, $prefix)) {
            Storage::disk('public')->delete(substr($url, strlen($prefix)));
        }
    }
}
