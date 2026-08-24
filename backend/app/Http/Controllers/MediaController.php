<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class MediaController extends Controller
{
    public function index(Request $request)
    {
        $disk = Storage::disk('public');
        $files = [];
        $directories = [];

        $allFiles = $disk->allFiles();

        foreach ($allFiles as $path) {
            if (str_ends_with($path, '.gitignore')) {
                continue;
            }

            $url = '/storage/' . $path;
            $usage = $this->findUsage($url);
            $parts = explode('/', $path);
            $bucket = $parts[0] ?? 'unknown';

            $files[] = [
                'path' => $path,
                'url' => $url,
                'bucket' => $bucket,
                'size' => $disk->size($path),
                'lastModified' => $disk->lastModified($path),
                'usage' => $usage,
            ];
        }

        $buckets = collect($files)->groupBy('bucket')->map(function ($items, $key) {
            return [
                'name' => $key,
                'count' => $items->count(),
                'totalSize' => $items->sum('size'),
            ];
        })->values();

        return response()->json([
            'data' => [
                'files' => $files,
                'buckets' => $buckets,
                'total' => count($files),
                'totalSize' => collect($files)->sum('size'),
            ],
        ]);
    }

    private function findUsage(string $url): array
    {
        $usages = [];

        $mappings = [
            'profiles' => ['column' => 'photo', 'label' => 'Profil', 'nameColumn' => 'name'],
            'news' => ['column' => 'thumbnail', 'label' => 'Berita', 'nameColumn' => 'title'],
            'programs' => ['column' => 'image', 'label' => 'Program Keahlian (Gambar)', 'nameColumn' => 'name'],
            'programs_logo' => ['column' => 'logo', 'label' => 'Program Keahlian (Logo)', 'nameColumn' => 'name'],
            'facilities' => ['column' => 'photo', 'label' => 'Fasilitas', 'nameColumn' => 'name'],
            'staff' => ['column' => 'photo', 'label' => 'Staf', 'nameColumn' => 'name'],
            'achievements' => ['column' => 'photo', 'label' => 'Prestasi', 'nameColumn' => 'title'],
            'teacher_activities' => ['column' => 'photo', 'label' => 'Kegiatan Guru', 'nameColumn' => 'title'],
            'education_staff' => ['column' => 'photo', 'label' => 'Tenaga Pendidik', 'nameColumn' => 'name'],
            'spmb_content' => ['column' => 'banner_image', 'label' => 'SPMB (Banner)', 'nameColumn' => 'title'],
            'spmb_posters' => ['column' => 'image', 'label' => 'SPMB (Poster)', 'nameColumn' => 'title'],
            'osis' => ['column' => 'logo', 'label' => 'OSIS (Logo)', 'nameColumn' => 'name'],
            'osis_members' => ['column' => 'photo', 'label' => 'Anggota OSIS', 'nameColumn' => 'name'],
            'osis_activities' => ['column' => 'photo', 'label' => 'Kegiatan OSIS', 'nameColumn' => 'title'],
            'extracurriculars' => ['column' => 'logo', 'label' => 'Ekstrakurikuler (Logo)', 'nameColumn' => 'name'],
            'extracurriculars_photo' => ['column' => 'photo', 'label' => 'Ekstrakurikuler (Foto)', 'nameColumn' => 'name'],
            'galleries' => ['column' => 'cover_image', 'label' => 'Galeri (Sampul)', 'nameColumn' => 'title'],
            'gallery_images' => ['column' => 'image', 'label' => 'Galeri (Gambar)', 'nameColumn' => null],
            'job_vacancies' => ['column' => 'company_logo', 'label' => 'Lowongan Kerja (Logo)', 'nameColumn' => 'title'],
            'bkk_partners' => ['column' => 'logo', 'label' => 'Mitra BKK', 'nameColumn' => 'name'],
            'sdm_gurus' => ['column' => 'photo', 'label' => 'Guru (SDM)', 'nameColumn' => 'name'],
            'sdm_tendiks' => ['column' => 'photo', 'label' => 'Tendik (SDM)', 'nameColumn' => 'name'],
            'page_banners' => ['column' => 'image', 'label' => 'Banner Halaman', 'nameColumn' => 'title'],
        ];

        foreach ($mappings as $table => $config) {
            $column = $config['column'];
            $label = $config['label'];
            $nameColumn = $config['nameColumn'];

            try {
                $query = DB::table($table)->where($column, $url);
                if ($nameColumn && DB::getSchemaBuilder()->hasColumn($table, $nameColumn)) {
                    $records = $query->select('id', $nameColumn)->get();
                    foreach ($records as $record) {
                        $usages[] = [
                            'table' => $table,
                            'label' => $label,
                            'recordId' => $record->id,
                            'recordName' => $record->$nameColumn ?? null,
                        ];
                    }
                } else {
                    $records = $query->select('id')->get();
                    foreach ($records as $record) {
                        $usages[] = [
                            'table' => $table,
                            'label' => $label,
                            'recordId' => $record->id,
                            'recordName' => null,
                        ];
                    }
                }
            } catch (\Throwable) {
                // Table might not exist, skip
            }
        }

        // Check JSON columns (mading_posts.images)
        try {
            $posts = DB::table('mading_posts')->where('images', 'like', '%' . $url . '%')->select('id', 'title')->get();
            foreach ($posts as $post) {
                $usages[] = [
                    'table' => 'mading_posts',
                    'label' => 'Mading (Gallery)',
                    'recordId' => $post->id,
                    'recordName' => $post->title ?? null,
                ];
            }
        } catch (\Throwable) {
        }

        // Check content_records (home content, etc.)
        try {
            $records = DB::table('content_records')->where('data', 'like', '%' . $url . '%')->select('id', 'content_type')->get();
            foreach ($records as $record) {
                $usages[] = [
                    'table' => 'content_records',
                    'label' => 'Konten (' . $record->content_type . ')',
                    'recordId' => $record->id,
                    'recordName' => $record->content_type,
                ];
            }
        } catch (\Throwable) {
        }

        return $usages;
    }
}
