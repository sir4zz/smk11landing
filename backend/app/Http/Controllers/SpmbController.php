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
     * Public endpoint: only active posters, ordered by sort_order.
     * Never leaks inactive posters to the public site.
     */
    public function posters()
    {
        $posters = SpmbPoster::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('created_at')
            ->get()
            ->map(fn (SpmbPoster $poster) => [
                'id' => $poster->id,
                'title' => $poster->title,
                'image' => $poster->image,
                'sort_order' => (int) $poster->sort_order,
            ]);

        return response()->json(['data' => $posters, 'error' => null]);
    }

    /**
     * Admin listing: all posters (active + inactive) newest managed first.
     */
    public function adminPosters()
    {
        $posters = SpmbPoster::query()
            ->orderBy('sort_order')
            ->orderBy('created_at')
            ->get();

        return response()->json(['data' => $posters, 'error' => null]);
    }

    public function storePoster(Request $request)
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'image' => ['required', 'string', 'max:1000'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);

        $poster = SpmbPoster::create([
            'title' => trim($data['title']),
            'image' => $data['image'],
            'is_active' => (bool) ($data['is_active'] ?? true),
            'sort_order' => (int) ($data['sort_order'] ?? 0),
        ]);

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
        ]);

        if (array_key_exists('title', $data)) $data['title'] = trim($data['title']);
        $poster->update($data);

        return response()->json(['data' => $poster->fresh(), 'error' => null]);
    }

    public function destroyPoster(string $id)
    {
        $poster = SpmbPoster::findOrFail($id);
        $poster->delete();

        return response()->json(['data' => null, 'error' => null]);
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
                    $url = Storage::disk('public')->url($key);
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
            $url = Storage::disk('public')->url($key);
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
}