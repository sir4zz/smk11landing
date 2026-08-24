<?php

namespace App\Http\Controllers;

use App\Models\Achievement;
use App\Models\Extracurricular;
use App\Models\Gallery;
use App\Models\GalleryImage;
use App\Models\MadingPost;
use App\Models\News;
use App\Models\OsisActivity;
use App\Models\TeacherActivity;
use App\Services\AIContentUploadService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AIContentUploadController extends Controller
{
    public function __construct(protected AIContentUploadService $ai)
    {
    }

    /**
     * POST /api/admin/ai-content-upload/analyze
     *
     * Analyze each image separately and return results per image.
     * Max 3 images per request.
     */
    public function analyze(Request $request)
    {
        $data = $request->validate([
            'image_urls' => ['required', 'array', 'min:1', 'max:3'],
            'image_urls.*' => ['required', 'string', 'max:2000'],
            'content_type' => ['sometimes', 'string', 'in:auto,kegiatan_guru,kegiatan_siswa,galeri,prestasi,osis,ekstrakurikuler,pengumuman,berita,mading,lainnya'],
        ]);

        $contentType = $data['content_type'] ?? 'auto';
        $results = [];

        foreach ($data['image_urls'] as $index => $url) {
            try {
                $result = $this->ai->analyzeImages([$url], $contentType);
                $results[] = [
                    'index' => $index,
                    'image_url' => $url,
                    'success' => true,
                    'data' => $result,
                ];
            } catch (\Throwable $e) {
                $results[] = [
                    'index' => $index,
                    'image_url' => $url,
                    'success' => false,
                    'data' => null,
                    'error' => $e->getMessage(),
                ];
            }
        }

        return response()->json(['data' => $results, 'error' => null]);
    }

    /**
     * POST /api/admin/ai-content-upload/save
     *
     * Save AI-generated content to the appropriate database table.
     */
    public function save(Request $request)
    {
        $data = $request->validate([
            'content_type' => ['required', 'string', 'in:kegiatan_guru,kegiatan_siswa,galeri,prestasi,osis,ekstrakurikuler,pengumuman,berita,mading,lainnya'],
            'image_urls' => ['required', 'array', 'min:1'],
            'image_urls.*' => ['required', 'string'],
            'title' => ['required', 'string', 'max:500'],
            'description' => ['sometimes', 'string', 'max:10000'],
            'category' => ['sometimes', 'nullable', 'string', 'max:200'],
            'date' => ['sometimes', 'nullable', 'string', 'max:20'],
            'location' => ['sometimes', 'nullable', 'string', 'max:500'],
            'tags' => ['sometimes', 'nullable', 'array'],
            'tags.*' => ['string', 'max:100'],
            'caption' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'summary' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'status' => ['sometimes', 'string', 'in:draft,published'],
            'author' => ['sometimes', 'nullable', 'string', 'max:200'],
            'level' => ['sometimes', 'nullable', 'string', 'max:100'],
            'rank' => ['sometimes', 'nullable', 'string', 'max:100'],
            'event' => ['sometimes', 'nullable', 'string', 'max:500'],
            'year' => ['sometimes', 'nullable', 'integer'],
            'cover_image_index' => ['sometimes', 'nullable', 'integer'],
        ]);

        $user = $request->user();
        $status = $data['status'] ?? 'draft';
        $imageUrls = $data['image_urls'];
        $coverIndex = $data['cover_image_index'] ?? 0;
        $coverImage = $imageUrls[$coverIndex] ?? $imageUrls[0] ?? '';

        try {
            $result = DB::transaction(function () use ($data, $user, $status, $imageUrls, $coverImage) {
                return match ($data['content_type']) {
                    'berita' => $this->saveNews($data, $user, $status, $coverImage),
                    'kegiatan_guru' => $this->saveTeacherActivity($data, $user, $status, $coverImage),
                    'galeri' => $this->saveGallery($data, $user, $status, $imageUrls, $coverImage),
                    'prestasi' => $this->saveAchievement($data, $user, $status, $coverImage),
                    'osis' => $this->saveOsisActivity($data, $user, $status, $coverImage),
                    'ekstrakurikuler' => $this->saveExtracurricular($data, $user, $status, $coverImage),
                    'mading' => $this->saveMadingPost($data, $user, $status, $imageUrls, $coverImage),
                    default => $this->saveAsGallery($data, $user, $status, $imageUrls, $coverImage),
                };
            });

            return response()->json([
                'data' => $result,
                'error' => null,
            ]);
        } catch (ValidationException $e) {
            return response()->json(['error' => $e->errors()], 422);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('AI Content Upload save failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'error' => ['message' => 'Gagal menyimpan konten. Silakan coba lagi.'],
            ], 500);
        }
    }

    private function saveNews(array $data, $user, string $status, string $coverImage): array
    {
        $slug = Str::slug($data['title']);
        $existing = News::query()->where('slug', $slug)->exists();
        if ($existing) {
            $slug = $slug.'-'.substr(uniqid(), -6);
        }

        $row = News::create([
            'title' => $data['title'],
            'slug' => $slug,
            'date' => $data['date'] ?? now()->format('Y-m-d'),
            'excerpt' => $data['summary'] ?? $data['caption'] ?? '',
            'content' => $data['description'] ?? '',
            'thumbnail' => $coverImage,
            'category' => $data['category'] ?? 'Informasi',
            'author' => $data['author'] ?? $user->name ?? 'Admin',
            'source_type' => 'manual',
            'source_label' => 'Berita mandiri',
            'source_note' => '',
            'source_url' => '',
        ]);

        return ['type' => 'berita', 'id' => $row->id, 'slug' => $row->slug];
    }

    private function saveTeacherActivity(array $data, $user, string $status, string $coverImage): array
    {
        $row = TeacherActivity::create([
            'title' => $data['title'],
            'date' => $data['date'] ?? now()->format('Y-m-d'),
            'category' => $data['category'] ?? 'Kegiatan',
            'description' => $data['description'] ?? '',
            'photo' => $coverImage,
        ]);

        return ['type' => 'kegiatan_guru', 'id' => $row->id];
    }

    private function saveGallery(array $data, $user, string $status, array $imageUrls, string $coverImage): array
    {
        $slug = Str::slug($data['title']);
        $existing = Gallery::query()->where('slug', $slug)->exists();
        if ($existing) {
            $slug = $slug.'-'.substr(uniqid(), -6);
        }

        $gallery = Gallery::create([
            'title' => $data['title'],
            'slug' => $slug,
            'description' => $data['description'] ?? '',
            'category' => $data['category'] ?? 'Kegiatan',
            'event_date' => $data['date'] ?? now()->format('Y-m-d'),
            'location' => $data['location'] ?? '',
            'cover_image' => $coverImage,
            'is_published' => $status === 'published',
        ]);

        // Add all images
        foreach ($imageUrls as $index => $url) {
            GalleryImage::create([
                'gallery_id' => $gallery->id,
                'image' => $url,
                'caption' => $index === 0 ? ($data['caption'] ?? '') : '',
                'sort_order' => $index,
            ]);
        }

        return ['type' => 'galeri', 'id' => $gallery->id, 'slug' => $gallery->slug];
    }

    private function saveAchievement(array $data, $user, string $status, string $coverImage): array
    {
        $row = Achievement::create([
            'title' => $data['title'],
            'event' => $data['event'] ?? $data['category'] ?? '',
            'year' => $data['year'] ?? (int) date('Y'),
            'level' => $data['level'] ?? '',
            'rank' => $data['rank'] ?? '',
            'students' => [],
            'photo' => $coverImage,
        ]);

        return ['type' => 'prestasi', 'id' => $row->id];
    }

    private function saveOsisActivity(array $data, $user, string $status, string $coverImage): array
    {
        $row = OsisActivity::create([
            'title' => $data['title'],
            'description' => $data['description'] ?? '',
            'photo' => $coverImage,
            'activity_date' => $data['date'] ?? now()->format('Y-m-d'),
            'status' => $status === 'published' ? 'published' : 'draft',
        ]);

        return ['type' => 'osis', 'id' => $row->id];
    }

    private function saveExtracurricular(array $data, $user, string $status, string $coverImage): array
    {
        $slug = Str::slug($data['title']);
        $existing = Extracurricular::query()->where('slug', $slug)->exists();
        if ($existing) {
            $slug = $slug.'-'.substr(uniqid(), -6);
        }

        $row = Extracurricular::create([
            'name' => $data['title'],
            'slug' => $slug,
            'description' => $data['description'] ?? '',
            'short_description' => $data['summary'] ?? mb_substr($data['description'] ?? '', 0, 150),
            'photo' => $coverImage,
            'category' => $data['category'] ?? 'Lainnya',
            'status' => $status === 'published' ? 'active' : 'inactive',
        ]);

        return ['type' => 'ekstrakurikuler', 'id' => $row->id, 'slug' => $row->slug];
    }

    private function saveMadingPost(array $data, $user, string $status, array $imageUrls, string $coverImage): array
    {
        $row = MadingPost::create([
            'title' => $data['title'],
            'content' => $data['description'] ?? '',
            'author_id' => $user->id,
            'author_name' => $user->name ?? 'Admin',
            'author_role' => 'admin',
            'cover_image' => $coverImage,
            'images' => $imageUrls,
            'status' => $status === 'published' ? 'published' : 'draft',
            'ai_assisted' => true,
            'published_at' => $status === 'published' ? now() : null,
        ]);

        return ['type' => 'mading', 'id' => $row->id];
    }

    private function saveAsGallery(array $data, $user, string $status, array $imageUrls, string $coverImage): array
    {
        // Default: save as gallery for unknown content types
        $slug = Str::slug($data['title']);
        $existing = Gallery::query()->where('slug', $slug)->exists();
        if ($existing) {
            $slug = $slug.'-'.substr(uniqid(), -6);
        }

        $gallery = Gallery::create([
            'title' => $data['title'],
            'slug' => $slug,
            'description' => $data['description'] ?? '',
            'category' => $data['category'] ?? 'Lainnya',
            'event_date' => $data['date'] ?? now()->format('Y-m-d'),
            'location' => $data['location'] ?? '',
            'cover_image' => $coverImage,
            'is_published' => $status === 'published',
        ]);

        foreach ($imageUrls as $index => $url) {
            GalleryImage::create([
                'gallery_id' => $gallery->id,
                'image' => $url,
                'caption' => $index === 0 ? ($data['caption'] ?? '') : '',
                'sort_order' => $index,
            ]);
        }

        return ['type' => 'galeri', 'id' => $gallery->id, 'slug' => $gallery->slug];
    }
}
