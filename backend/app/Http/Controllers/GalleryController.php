<?php

namespace App\Http\Controllers;

use App\Models\Gallery;
use App\Models\GalleryImage;
use App\Models\GalleryVideo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class GalleryController extends Controller
{
    public const IMAGE_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    // ------------------------------------------------------------------
    // PUBLIC
    // ------------------------------------------------------------------

    public function index(Request $request)
    {
        $query = Gallery::query()
            ->where('is_published', true)
            ->withCount('images')
            ->withCount('videos');

        if ($request->filled('year')) {
            $query->whereYear('event_date', (int) $request->query('year'));
        }

        if ($request->filled('category')) {
            $query->where('category', $request->query('category'));
        }

        $query->orderByDesc('event_date')->orderByDesc('created_at');

        $limit = min(max((int) $request->query('limit', 9), 1), 60);
        $page = max((int) $request->query('page', 1), 1);

        $total = (clone $query)->count();
        $rows = (clone $query)
            ->skip(($page - 1) * $limit)
            ->take($limit)
            ->get();

        return response()->json([
            'data' => $rows,
            'meta' => [
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
                'last_page' => max((int) ceil($total / $limit), 1),
            ],
            'error' => null,
        ]);
    }

    public function show(string $slug)
    {
        $row = Gallery::query()
            ->where('slug', $slug)
            ->where('is_published', true)
            ->with('images')
            ->with('videos')
            ->withCount('images')
            ->withCount('videos')
            ->first();

        if (! $row) {
            return response()->json(['data' => null, 'error' => ['message' => 'Galeri tidak ditemukan.']], 404);
        }

        return response()->json(['data' => $row, 'error' => null]);
    }

    public function categories()
    {
        $categories = Gallery::query()
            ->where('is_published', true)
            ->where('category', '!=', '')
            ->distinct()
            ->orderBy('category')
            ->pluck('category');

        return response()->json(['data' => $categories, 'error' => null]);
    }

    // ------------------------------------------------------------------
    // ADMIN
    // ------------------------------------------------------------------

    public function adminIndex(Request $request)
    {
        $query = Gallery::query()->with('images')->with('videos')->withCount('images')->withCount('videos');

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category')) {
            $query->where('category', $request->query('category'));
        }

        if ($request->filled('year')) {
            $query->whereYear('event_date', (int) $request->query('year'));
        }

        $query->orderByDesc('created_at');

        $limit = min(max((int) $request->query('limit', 10), 1), 100);
        $page = max((int) $request->query('page', 1), 1);

        $total = (clone $query)->count();
        $rows = (clone $query)
            ->skip(($page - 1) * $limit)
            ->take($limit)
            ->get();

        return response()->json([
            'data' => $rows,
            'meta' => [
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
                'last_page' => max((int) ceil($total / $limit), 1),
            ],
            'error' => null,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->all();

        if (empty($data['title'])) {
            throw ValidationException::withMessages(['title' => 'Judul wajib diisi.']);
        }

        $cover = $this->resolveCover($request);
        if (empty($cover)) {
            throw ValidationException::withMessages(['cover_image' => 'Cover wajib diunggah.']);
        }

        $gallery = Gallery::create([
            'title' => $data['title'],
            'slug' => $this->uniqueSlug($data['slug'] ?? Str::slug($data['title']) ?: 'galeri'),
            'description' => $data['description'] ?? '',
            'category' => $data['category'] ?? 'Kegiatan',
            'event_date' => $data['event_date'] ?? null,
            'location' => $data['location'] ?? '',
            'cover_image' => $cover,
            'is_published' => ! empty($data['is_published']),
        ]);

        $this->syncImages($gallery, $data['images'] ?? [], $request);

        return response()->json(['data' => $gallery->fresh()->load('images')->load('videos'), 'error' => null], 201);
    }

    public function update(Request $request, string $id)
    {
        $gallery = Gallery::findOrFail($id);
        $data = $request->all();

        $payload = [];
        if (array_key_exists('title', $data)) {
            $payload['title'] = $data['title'];
            if (empty($data['slug'])) {
                $payload['slug'] = $this->uniqueSlug(Str::slug($data['title']) ?: 'galeri', $gallery->id);
            }
        }
        if (array_key_exists('slug', $data) && ! empty($data['slug'])) {
            $payload['slug'] = $this->uniqueSlug($data['slug'], $gallery->id);
        }
        foreach (['description', 'category', 'location'] as $field) {
            if (array_key_exists($field, $data)) {
                $payload[$field] = $data[$field];
            }
        }
        if (array_key_exists('event_date', $data)) {
            $payload['event_date'] = $data['event_date'] ?: null;
        }
        if (array_key_exists('is_published', $data)) {
            $payload['is_published'] = ! empty($data['is_published']);
        }
        if (array_key_exists('cover_image', $data) && ! empty($data['cover_image'])) {
            $payload['cover_image'] = $data['cover_image'];
        }

        if (! empty($payload)) {
            $gallery->update($payload);
        }

        // Foto & video album dikelola lewat endpoint khusus (storeImages / storeVideos / destroy* / reorder*),
        // jadi update di sini tidak boleh mengganti / menghapus konten yang sudah ada.

        return response()->json(['data' => $gallery->fresh()->load('images')->load('videos'), 'error' => null]);
    }

    public function destroy(string $id)
    {
        $gallery = Gallery::findOrFail($id);

        $this->deleteGalleryFiles($gallery);
        $gallery->images()->delete();
        $gallery->delete();

        return response()->json(['data' => null, 'error' => null]);
    }

    public function storeImages(Request $request, string $id)
    {
        $gallery = Gallery::findOrFail($id);

        $this->validateImageInput($request);

        $added = 0;
        $maxOrder = (int) $gallery->images()->max('sort_order');

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $file) {
                $gallery->images()->create([
                    'image' => $this->storeFile($file),
                    'caption' => '',
                    'sort_order' => ++$maxOrder,
                    'created_at' => now(),
                ]);
                $added++;
            }
        } elseif (is_array($request->input('images'))) {
            foreach ($request->input('images') as $image) {
                $url = is_string($image) ? $image : ($image['image'] ?? null);
                if (! $url) {
                    continue;
                }
                $gallery->images()->create([
                    'image' => $url,
                    'caption' => is_array($image) ? ($image['caption'] ?? '') : '',
                    'sort_order' => ++$maxOrder,
                    'created_at' => now(),
                ]);
                $added++;
            }
        }

        return response()->json([
            'data' => $gallery->fresh()->load('images'),
            'error' => null,
        ], $added ? 201 : 200);
    }

    public function destroyImage(string $id)
    {
        $image = GalleryImage::findOrFail($id);

        $this->deleteFileFromUrl($image->image);
        $image->delete();

        return response()->json(['data' => null, 'error' => null]);
    }

    public function storeVideos(Request $request, string $id)
    {
        $gallery = Gallery::findOrFail($id);

        $videos = $request->input('videos');
        if (! is_array($videos) || empty($videos)) {
            throw ValidationException::withMessages(['videos' => 'Minimal satu video diperlukan.']);
        }

        $added = 0;
        $maxOrder = (int) $gallery->videos()->max('sort_order');

        foreach ($videos as $video) {
            $url = is_string($video) ? $video : ($video['youtube_url'] ?? '');
            if (empty($url)) {
                continue;
            }
            $gallery->videos()->create([
                'youtube_url' => trim($url),
                'title' => is_array($video) ? trim($video['title'] ?? '') : '',
                'sort_order' => ++$maxOrder,
            ]);
            $added++;
        }

        return response()->json([
            'data' => $gallery->fresh()->load('videos'),
            'error' => null,
        ], $added ? 201 : 200);
    }

    public function destroyVideo(string $id)
    {
        GalleryVideo::findOrFail($id)->delete();

        return response()->json(['data' => null, 'error' => null]);
    }

    public function reorderVideos(Request $request)
    {
        $request->validate([
            'videos' => ['required', 'array'],
        ]);

        foreach ($request->input('videos') as $item) {
            if (empty($item['id']) || ! array_key_exists('sort_order', $item)) {
                continue;
            }
            GalleryVideo::query()
                ->where('id', $item['id'])
                ->update(['sort_order' => (int) $item['sort_order']]);
        }

        return response()->json(['data' => null, 'error' => null]);
    }

    public function reorderImages(Request $request)
    {
        $request->validate([
            'images' => ['required', 'array'],
        ]);

        foreach ($request->input('images') as $item) {
            if (empty($item['id']) || ! array_key_exists('sort_order', $item)) {
                continue;
            }
            GalleryImage::query()
                ->where('id', $item['id'])
                ->update(['sort_order' => (int) $item['sort_order']]);
        }

        return response()->json(['data' => null, 'error' => null]);
    }

    // ------------------------------------------------------------------
    // HELPERS
    // ------------------------------------------------------------------

    protected function validateImageInput(Request $request): void
    {
        if ($request->hasFile('images')) {
            $request->validate([
                'images' => ['required', 'array'],
                'images.*' => ['file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            ]);
            return;
        }

        if (is_array($request->input('images'))) {
            foreach ($request->input('images') as $image) {
                $url = is_string($image) ? $image : ($image['image'] ?? null);
                if (empty($url) || ! is_string($url)) {
                    throw ValidationException::withMessages(['images' => 'Data foto tidak valid.']);
                }
            }
            return;
        }

        throw ValidationException::withMessages(['images' => 'Minimal satu foto diperlukan.']);
    }

    protected function resolveCover(Request $request): string
    {
        if ($request->hasFile('cover_image')) {
            $request->validate([
                'cover_image' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            ]);
            return $this->storeFile($request->file('cover_image'), true);
        }

        $cover = $request->input('cover_image');
        if (is_string($cover) && $cover !== '') {
            return $cover;
        }

        return '';
    }

    protected function storeFile($file, bool $cover = false): string
    {
        $directory = 'gallery/'.($cover ? 'covers' : 'images').'/'.now()->format('Y/m');
        $optimized = $this->optimizeImage($file);
        if ($optimized) {
            $name = uniqid().'-'.Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)).'.jpg';
            Storage::disk('public')->putFileAs($directory, $optimized, $name);
            @unlink($optimized->getPathname());
        } else {
            $name = uniqid().'-'.Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)).'.'.$file->getClientOriginalExtension();
            Storage::disk('public')->putFileAs($directory, $file, $name);
        }

        return '/storage/'.$directory.'/'.$name;
    }

    protected function optimizeImage($file): ?\Symfony\Component\HttpFoundation\File\UploadedFile
    {
        $maxDim = 1600;
        $quality = 82;

        $src = match (strtolower($file->getClientOriginalExtension())) {
            'png' => @imagecreatefrompng($file->getPathname()),
            'gif' => @imagecreatefromgif($file->getPathname()),
            'webp' => @imagecreatefromwebp($file->getPathname()),
            default => @imagecreatefromjpeg($file->getPathname()),
        };
        if ($src === false) {
            return null;
        }

        $w = imagesx($src);
        $h = imagesy($src);
        $ratio = min(1, $maxDim / max($w, $h));
        $nw = (int) round($w * $ratio);
        $nh = (int) round($h * $ratio);
        $dst = imagecreatetruecolor(max(1, $nw), max(1, $nh));
        imagecopyresampled($dst, $src, 0, 0, 0, 0, $nw, $nh, $w, $h);

        $tmp = tempnam(sys_get_temp_dir(), 'img');
        $savedSize = null;
        if (imagejpeg($dst, $tmp, $quality)) {
            $savedSize = filesize($tmp);
        }
        imagedestroy($src);
        imagedestroy($dst);

        if ($savedSize === null) {
            @unlink($tmp);
            return null;
        }
        if ($savedSize >= $file->getSize()) {
            @unlink($tmp);
            return null;
        }

        return new \Symfony\Component\HttpFoundation\File\UploadedFile(
            $tmp,
            preg_replace('/\.(png|gif|webp)$/i', '.jpg', $file->getClientOriginalName()),
            'image/jpeg',
            null,
            true
        );
    }

    protected function syncImages(Gallery $gallery, array $images, Request $request): void
    {
        if (empty($images)) {
            return;
        }

        $this->validateImageInput($request);

        $gallery->images()->delete();

        $maxOrder = 0;
        foreach ($images as $image) {
            if ($image instanceof \Illuminate\Http\UploadedFile) {
                $url = $this->storeFile($image);
                $caption = '';
            } elseif (is_string($image)) {
                $url = $image;
                $caption = '';
            } else {
                $url = $image['image'] ?? '';
                $caption = $image['caption'] ?? '';
            }
            if (empty($url)) {
                continue;
            }
            $gallery->images()->create([
                'image' => $url,
                'caption' => $caption,
                'sort_order' => $maxOrder++,
                'created_at' => now(),
            ]);
        }
    }

    protected function deleteGalleryFiles(Gallery $gallery): void
    {
        $paths = collect($gallery->images()->pluck('image'))->push($gallery->cover_image);
        $this->deleteFilesFromUrls($paths->all());
    }

    protected function deleteFilesFromUrls(array $urls): void
    {
        foreach ($urls as $url) {
            $this->deleteFileFromUrl($url);
        }
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

    protected function uniqueSlug(string $slug, ?string $ignoreId = null): string
    {
        $slug = Str::slug($slug) ?: 'galeri';
        $base = $slug;
        $i = 2;
        $query = Gallery::query()->where('slug', $slug);
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
