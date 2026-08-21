<?php

namespace App\Http\Controllers;

use App\Models\SpmbContent;
use App\Models\SpmbPoster;
use Illuminate\Http\File;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SpmbController extends Controller
{
    public function index()
    {
        $content = SpmbContent::query()->orderBy('created_at')->first();

        return response()->json($content);
    }

    public function store(Request $request)
    {
        $payload = $request->all();
        unset($payload['id'], $payload['created_at'], $payload['updated_at']);

        $content = SpmbContent::create($payload);

        return response()->json($content, 201);
    }

    public function update(Request $request, string $id)
    {
        $content = SpmbContent::findOrFail($id);

        $payload = $request->all();
        unset($payload['id'], $payload['created_at'], $payload['updated_at']);

        $content->update($payload);

        return response()->json($content);
    }

    // ------------------------------------------------------------------
    // SPMB Posters (informational flyers/images)
    // ------------------------------------------------------------------

    /**
     * Public endpoint: only active, already-published announcements (posters).
     * The featured (pengumuman utama) one is returned first, then by sort
     * order and newest first. Inactive or scheduled posters never leak.
     */
    public function posters()
    {
        $posters = SpmbPoster::query()
            ->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('published_at')->orWhere('published_at', '<=', now());
            })
            ->orderByDesc('is_featured')
            ->orderBy('sort_order')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (SpmbPoster $poster) => [
                'id' => $poster->id,
                'title' => $poster->title,
                'image' => $poster->image,
                'sort_order' => (int) $poster->sort_order,
                'is_featured' => (bool) $poster->is_featured,
                'published_at' => $poster->published_at?->toIso8601String(),
            ]);

        return response()->json(['data' => $posters, 'error' => null]);
    }

    /**
     * Admin listing: all announcements (active + inactive, scheduled or not)
     * with the featured one first, then by sort order and newest first.
     */
    public function adminPosters()
    {
        $posters = SpmbPoster::query()
            ->orderByDesc('is_featured')
            ->orderBy('sort_order')
            ->orderByDesc('created_at')
            ->with('creator:id,name')
            ->get()
            ->map(fn (SpmbPoster $poster) => [
                'id' => $poster->id,
                'title' => $poster->title,
                'image' => $poster->image,
                'is_active' => (bool) $poster->is_active,
                'sort_order' => (int) $poster->sort_order,
                'is_featured' => (bool) $poster->is_featured,
                'published_at' => $poster->published_at?->toIso8601String(),
                'created_by' => $poster->created_by,
                'creator_name' => $poster->creator?->name,
                'created_at' => $poster->created_at?->toIso8601String(),
                'updated_at' => $poster->updated_at?->toIso8601String(),
            ]);

        return response()->json(['data' => $posters, 'error' => null]);
    }

    public function storePoster(Request $request)
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'image' => ['required', 'string', 'max:1000'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'published_at' => ['sometimes', 'nullable', 'date'],
            'is_featured' => ['sometimes', 'boolean'],
        ]);

        $poster = SpmbPoster::create([
            'title' => trim($data['title']),
            'image' => $data['image'],
            'is_active' => (bool) ($data['is_active'] ?? true),
            'sort_order' => (int) ($data['sort_order'] ?? 0),
            'published_at' => $data['published_at'] ?? null,
            'is_featured' => (bool) ($data['is_featured'] ?? false),
            'created_by' => $request->user()?->id,
        ]);

        $this->enforceSingleFeatured($poster);

        return response()->json(['data' => $poster, 'error' => null], 201);
    }

    public function updatePoster(Request $request, string $id)
    {
        $poster = SpmbPoster::findOrFail($id);

        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'image' => ['sometimes', 'string', 'max:1000'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'published_at' => ['sometimes', 'nullable', 'date'],
            'is_featured' => ['sometimes', 'boolean'],
        ]);

        if (array_key_exists('title', $data)) $data['title'] = trim($data['title']);
        $poster->update($data);

        $this->enforceSingleFeatured($poster);

        return response()->json(['data' => $poster->fresh(), 'error' => null]);
    }

    public function destroyPoster(string $id)
    {
        $poster = SpmbPoster::findOrFail($id);

        if ($poster->image) {
            $key = preg_replace('#^/storage/#', '', $poster->image);
            if ($key && Storage::disk('public')->exists($key)) {
                Storage::disk('public')->delete($key);
            }
        }

        $poster->delete();

        return response()->json(['data' => null, 'error' => null]);
    }

    /**
     * Only one announcement can be the featured "Pengumuman Utama" at a time.
     * When a poster is marked as featured, all other posters are unmarked.
     */
    private function enforceSingleFeatured(SpmbPoster $poster): void
    {
        if (! $poster->is_featured) return;

        SpmbPoster::query()
            ->where('is_featured', true)
            ->where('id', '!=', $poster->id)
            ->update(['is_featured' => false]);
    }

    /**
     * Image upload for SPMB posters. Only JPG/JPEG/PNG/WEBP are accepted,
     * size is capped at 10 MB, and images are re-encoded to WebP (quality 88)
     * to keep posters lightweight while preserving text sharpness. Falls back
     * to storing the original file when WebP encoding is unavailable.
     */
    public function uploadPoster(Request $request)
    {
        $request->validate([
            'file' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:10240'],
        ]);

        $file = $request->file('file');
        $base = 'spmb/posters/'.now()->format('Y/m');
        $name = uniqid('spmb-').'-'.preg_replace('/[^a-zA-Z0-9._-]/', '-', pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME));

        $url = null;
        $ext = strtolower($file->getClientOriginalExtension());

        $image = null;
        if ($ext === 'png' && function_exists('imagecreatefrompng')) {
            $image = imagecreatefrompng($file->getRealPath());
        } elseif (in_array($ext, ['jpg', 'jpeg'], true) && function_exists('imagecreatefromjpeg')) {
            $image = imagecreatefromjpeg($file->getRealPath());
        } elseif ($ext === 'webp' && function_exists('imagecreatefromwebp')) {
            $image = imagecreatefromwebp($file->getRealPath());
        }

        if ($image && function_exists('imagewebp')) {
            try {
                imagealphablending($image, true);
                imagesavealpha($image, true);

                $temp = tempnam(sys_get_temp_dir(), 'spmb-');
                if ($temp !== false && imagewebp($image, $temp, 88)) {
                    $key = $base.'/'.$name.'.webp';
                    Storage::disk('public')->putFileAs($base, new File($temp), $name.'.webp');
                    $url = '/storage/'.$key;
                    @unlink($temp);
                }
            } catch (\Throwable) {
                $url = null;
            } finally {
                imagedestroy($image);
            }
        }

        if (! $url) {
            $key = $base.'/'.$name.'.'.$ext;
            Storage::disk('public')->putFileAs($base, $file, $name.'.'.$ext);
            $url = '/storage/'.$key;
        }

        return response()->json([
            'data' => [
                'url' => $url,
                'size' => $file->getSize(),
                'mimeType' => $file->getMimeType(),
            ],
            'error' => null,
        ]);
    }

    /**
     * PDF upload for SPMB page attachment. Only PDF files are accepted,
     * size is capped at 20 MB.
     */
    public function uploadPdf(Request $request)
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:pdf', 'max:20480'],
        ]);

        $file = $request->file('file');
        $base = 'spmb/pdf/'.now()->format('Y/m');
        $name = uniqid('spmb-pdf-').'-'.preg_replace('/[^a-zA-Z0-9._-]/', '-', pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)).'.pdf';

        $key = $base.'/'.$name;
        Storage::disk('public')->putFileAs($base, $file, $name);
        $url = '/storage/'.$key;

        return response()->json([
            'data' => [
                'url' => $url,
                'size' => $file->getSize(),
                'mimeType' => $file->getMimeType(),
            ],
            'error' => null,
        ]);
    }
}
