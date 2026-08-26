<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class PruneOrphanMedia extends Command
{
    protected $signature = 'media:prune-orphans
                            {--dry-run : Hanya tampilkan file orphan tanpa menghapus}
                            {--force : Lewati konfirmasi}';

    protected $description = 'Hapus file media di disk public yang tidak lagi direferensikan tabel mana pun';

    /**
     * Kolom yang menyimpan URL /storage/... atau JSON berisi URL tersebut.
     * Nilai scalar maupun JSON array/object dipindai dengan regex, jadi aman.
     */
    private const MEDIA_COLUMNS = [
        'profiles' => ['photo'],
        'news' => ['thumbnail'],
        'programs' => ['image', 'logo'],
        'facilities' => ['photo'],
        'staff' => ['photo'],
        'achievements' => ['photo'],
        'teacher_activities' => ['photo'],
        'education_staff' => ['photo'],
        'spmb_content' => ['banner_image', 'pdf_attachment', 'pdf_attachments'],
        'spmb_posters' => ['image', 'images'],
        'osis' => ['logo'],
        'osis_members' => ['photo'],
        'osis_activities' => ['photo', 'documentation'],
        'extracurriculars' => ['logo', 'photo', 'documentation', 'gallery'],
        'galleries' => ['cover_image'],
        'gallery_images' => ['image'],
        'gallery_videos' => ['youtube_url', 'poster'],
        'job_vacancies' => ['company_logo'],
        'bkk_partners' => ['logo'],
        'sdm_gurus' => ['photo'],
        'sdm_tendiks' => ['photo'],
        'page_banners' => ['image'],
        'mading_posts' => ['cover_image', 'images', 'videos'],
        'students' => ['foto', 'doc_kk', 'doc_akta', 'doc_ijazah', 'doc_lainnya'],
        'student_data_change_requests' => ['old_data', 'proposed_data'],
        'guru_data_change_requests' => ['old_data', 'proposed_data'],
        'content_records' => ['data'],
    ];

    /** Kolom yang menyimpan path disk mentah (tanpa prefix /storage/). */
    private const RAW_PATH_COLUMNS = [
        'ppdb_documents' => ['file_path'],
    ];

    public function handle(): int
    {
        $disk = Storage::disk('public');
        $usedPaths = $this->collectUsedPaths();

        $files = collect($disk->allFiles())->filter(
            fn ($path) => ! str_ends_with($path, '.gitignore'),
        );

        $orphans = $files->reject(fn ($path) => $this->isUsed($path, $usedPaths))->values();

        $orphanSize = $orphans->sum(fn ($path) => $disk->size($path));

        $this->info(sprintf('Total file : %d', $files->count()));
        $this->info(sprintf('Dipakai DB : %d', $files->count() - $orphans->count()));
        $this->info(sprintf('Orphan     : %d (%s)', $orphans->count(), $this->formatBytes($orphanSize)));

        if ($orphans->isEmpty()) {
            $this->info('Tidak ada file orphan. Folder bersih.');

            return self::SUCCESS;
        }

        foreach ($orphans as $path) {
            $this->line('  - '.$path);
        }

        if ($this->option('dry-run')) {
            $this->warn('Mode dry-run: tidak ada file yang dihapus.');

            return self::SUCCESS;
        }

        if (! $this->option('force') && ! $this->confirm(sprintf('Hapus %d file orphan di atas?', $orphans->count()), true)) {
            $this->info('Dibatalkan.');

            return self::SUCCESS;
        }

        $deleted = 0;
        foreach ($orphans as $path) {
            if ($disk->delete($path)) {
                $deleted++;
            } else {
                $this->error("Gagal menghapus: {$path}");
            }
        }

        $this->pruneEmptyDirectories($disk);

        $this->info(sprintf('Selesai. %d file dihapus, %s dibebaskan.', $deleted, $this->formatBytes($orphanSize)));

        return self::SUCCESS;
    }

    private function collectUsedPaths(): array
    {
        $used = [];

        foreach (self::MEDIA_COLUMNS as $table => $columns) {
            try {
                if (! DB::getSchemaBuilder()->hasTable($table)) {
                    continue;
                }
            } catch (\Throwable) {
                continue;
            }

            foreach ($columns as $column) {
                try {
                    if (! DB::getSchemaBuilder()->hasColumn($table, $column)) {
                        continue;
                    }
                    $rows = DB::table($table)->select($column)->get();
                } catch (\Throwable) {
                    continue;
                }

                foreach ($rows as $row) {
                    $this->extractStoragePaths($row->{$column}, $used);
                }
            }
        }

        foreach (self::RAW_PATH_COLUMNS as $table => $columns) {
            try {
                if (! DB::getSchemaBuilder()->hasTable($table)) {
                    continue;
                }
            } catch (\Throwable) {
                continue;
            }

            foreach ($columns as $column) {
                try {
                    if (! DB::getSchemaBuilder()->hasColumn($table, $column)) {
                        continue;
                    }
                    $rows = DB::table($table)->select($column)->whereNotNull($column)->get();
                } catch (\Throwable) {
                    continue;
                }

                foreach ($rows as $row) {
                    $value = trim((string) $row->{$column});
                    if ($value !== '') {
                        $used[$value] = true;
                    }
                }
            }
        }

        return $used;
    }

    private function extractStoragePaths(mixed $value, array &$used): void
    {
        if ($value === null || $value === '') {
            return;
        }

        $raw = is_string($value) ? $value : json_encode($value);
        if (! is_string($raw) || $raw === '') {
            return;
        }

        // JSON bisa menyimpan slash ter-escape ("\/storage\/"), jadi pindai
        // versi mentah maupun versi yang sudah dinormalisasi.
        $normalized = str_replace('\\/', '/', $raw);
        if (! str_contains($raw, '/storage/') && ! str_contains($normalized, '/storage/')) {
            return;
        }

        foreach (array_unique([$raw, $normalized]) as $haystack) {
            if (! preg_match_all('#/storage/[^\s"\'<>\\\\)}\]]+#', $haystack, $matches)) {
                continue;
            }
            foreach ($matches[0] as $url) {
                $url = rtrim(urldecode($url), '.,;:!');
                $queryPos = strpos($url, '?');
                if ($queryPos !== false) {
                    $url = substr($url, 0, $queryPos);
                }
                $prefix = '/storage/';
                if (! str_starts_with($url, $prefix)) {
                    continue;
                }
                $path = substr($url, strlen($prefix));
                if ($path !== '') {
                    $used[$path] = true;
                }
            }
        }
    }

    private function isUsed(string $path, array $usedPaths): bool
    {
        if (isset($usedPaths[$path])) {
            return true;
        }

        $encoded = implode('/', array_map('rawurlencode', explode('/', $path)));
        if ($encoded !== $path && isset($usedPaths[$encoded])) {
            return true;
        }

        $decoded = urldecode($path);

        return $decoded !== $path && isset($usedPaths[$decoded]);
    }

    private function pruneEmptyDirectories($disk): void
    {
        $root = $disk->path('');

        $directories = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($root, \FilesystemIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::CHILD_FIRST,
        );

        foreach ($directories as $directory) {
            if (! $directory->isDir()) {
                continue;
            }
            $pathname = $directory->getPathname();
            $relative = ltrim(str_replace(['\\', $root], ['/', ''], $pathname), '/');
            @rmdir($pathname);
            clearstatcache();
            if (is_dir($pathname)) {
                continue;
            }
            $this->line("  - direktori kosong dihapus: {$relative}");
        }
    }

    private function formatBytes(int|float $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $index = 0;
        $value = (float) $bytes;
        while ($value >= 1024 && $index < count($units) - 1) {
            $value /= 1024;
            $index++;
        }

        return sprintf('%.1f %s', $value, $units[$index]);
    }
}
