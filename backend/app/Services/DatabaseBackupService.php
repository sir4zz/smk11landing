<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use ZipArchive;

/**
 * Content backup service: SQL dump (content only) + media files packed as .zip.
 * Backups are stored under storage/app/private/backups as .zip files.
 * System tables (users, roles, permissions, sessions, etc.) are excluded.
 */
class DatabaseBackupService
{
    private const DISK = 'local';
    private const DIRECTORY = 'backups';
    private const FILENAME_PATTERN = '/^[A-Za-z0-9._-]+\.zip$/';

    /** Keep only the latest N backups on disk to avoid bloat. */
    public const MAX_BACKUPS = 30;

    /**
     * Directories inside storage/app/public that contain media files.
     * These will be included in backups and restored on restore.
     */
    private const MEDIA_DIRECTORIES = [
        'photos',
        'gallery',
        'spmb',
    ];

    /**
     * System tables to EXCLUDE from backup.
     * Only content data is backed up — not user accounts, roles, permissions, etc.
     */
    private const EXCLUDED_TABLES = [
        'users',
        'password_reset_tokens',
        'sessions',
        'cache',
        'cache_locks',
        'jobs',
        'job_batches',
        'failed_jobs',
        'personal_access_tokens',
        'roles',
        'permissions',
        'role_permissions',
        'profiles',
    ];

    public function list(): array
    {
        $root = $this->root();
        if (! is_dir($root)) {
            return [];
        }

        $files = [];
        foreach (glob($root.'/*.zip') ?: [] as $file) {
            $files[] = [
                'name' => basename($file),
                'size' => (int) filesize($file),
                'created_at' => date('c', filemtime($file)),
            ];
        }

        usort($files, static fn (array $a, array $b): int => strcmp($b['name'], $a['name']));

        return $files;
    }

    public function create(): array
    {
        $this->ensureDirectory();

        $name = 'smkn11-full-'.now()->format('Ymd-His').'-'.Str::lower(Str::random(4)).'.zip';
        $tempDir = Storage::disk(self::DISK)->path('backups/tmp_'.Str::lower(Str::random(8)));
        $zipPath = Storage::disk(self::DISK)->path(self::DIRECTORY.'/'.$name);

        try {
            // Create temp working directory
            File::makeDirectory($tempDir, 0755, true, true);

            // 1. Generate SQL dump
            $sqlPath = $tempDir.'/database.sql';
            file_put_contents($sqlPath, $this->dumpSql());

            // 2. Copy media files
            $mediaDest = $tempDir.'/media';
            $publicDiskPath = Storage::disk('public')->path('/');
            foreach (self::MEDIA_DIRECTORIES as $dir) {
                $source = $publicDiskPath.$dir;
                if (is_dir($source)) {
                    $this->copyDirectory($source, $mediaDest.'/'.$dir);
                }
            }

            // 3. Write manifest
            $manifest = [
                'version' => '3.0',
                'type' => 'content_only',
                'created_at' => now()->toDateTimeString(),
                'database' => DB::connection()->getDatabaseName(),
                'media_directories' => self::MEDIA_DIRECTORIES,
                'excluded_tables' => self::EXCLUDED_TABLES,
                'php_version' => PHP_VERSION,
                'laravel_version' => app()->version(),
                'tables' => $this->tables(),
            ];
            file_put_contents($tempDir.'/manifest.json', json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

            // 4. Create ZIP archive
            $zip = new ZipArchive();
            if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
                throw new RuntimeException('Gagal membuat file ZIP archive.');
            }

            $this->addDirectoryToZip($zip, $tempDir, '');
            $zip->close();

            $this->prune();

            return $this->info($name);
        } finally {
            // Cleanup temp directory
            if (is_dir($tempDir)) {
                $this->removeDirectory($tempDir);
            }
        }
    }

    public function restore(string $uploadedPath): array
    {
        $tempDir = Storage::disk(self::DISK)->path('backups/restore_tmp_'.Str::lower(Str::random(8)));

        try {
            File::makeDirectory($tempDir, 0755, true, true);

            $zip = new ZipArchive();
            if ($zip->open($uploadedPath) !== true) {
                throw new RuntimeException('File ZIP tidak valid atau corrupt.');
            }

            $zip->extractTo($tempDir);
            $zip->close();

            // Validate backup structure
            if (! file_exists($tempDir.'/database.sql')) {
                throw new RuntimeException('File database.sql tidak ditemukan di dalam backup.');
            }

            $manifest = null;
            if (file_exists($tempDir.'/manifest.json')) {
                $manifest = json_decode(file_get_contents($tempDir.'/manifest.json'), true);
            }

            // 1. Restore SQL dump
            $sql = file_get_contents($tempDir.'/database.sql');
            if ($sql === false || $sql === '') {
                throw new RuntimeException('File database.sql kosong atau tidak dapat dibaca.');
            }

            $this->executeSqlDump($sql);

            // 2. Restore media files
            $mediaPath = $tempDir.'/media';
            if (is_dir($mediaPath)) {
                $publicDiskPath = Storage::disk('public')->path('/');
                $this->copyDirectory($mediaPath, $publicDiskPath);
            }

            $restoredTables = $manifest['tables'] ?? [];
            $restoredMedia = is_dir($mediaPath);

            return [
                'status' => 'success',
                'message' => 'Restore berhasil dilakukan.',
                'tables_restored' => count($restoredTables),
                'media_restored' => $restoredMedia,
                'manifest' => $manifest,
            ];
        } finally {
            if (is_dir($tempDir)) {
                $this->removeDirectory($tempDir);
            }
        }
    }

    public function delete(string $filename): bool
    {
        if (! $this->validName($filename)) {
            return false;
        }

        return Storage::disk(self::DISK)->delete(self::DIRECTORY.'/'.$filename);
    }

    public function path(string $filename): ?string
    {
        if (! $this->validName($filename)) {
            return null;
        }

        $path = Storage::disk(self::DISK)->path(self::DIRECTORY.'/'.$filename);

        return is_file($path) ? $path : null;
    }

    public function validName(string $filename): bool
    {
        return $filename !== '' && preg_match(self::FILENAME_PATTERN, $filename) === 1;
    }

    // ------------------------------------------------------------------
    // Dump generation
    // ------------------------------------------------------------------

    private function dumpSql(): string
    {
        if (! in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            throw new RuntimeException('Backup hanya didukung untuk database MySQL/MariaDB.');
        }

        $lines = [];
        $lines[] = '-- ============================================'.PHP_EOL;
        $lines[] = '-- SMKN 11 Website - Content Backup'.PHP_EOL;
        $lines[] = '-- Dibuat: '.now()->toDateTimeString().PHP_EOL;
        $lines[] = '-- Database: '.DB::connection()->getDatabaseName().PHP_EOL;
        $lines[] = '-- Tipe: Content Backup (Konten + Media)'.PHP_EOL;
        $lines[] = '-- Catatan: Tidak termasuk user, role, permission, sesi'.PHP_EOL;
        $lines[] = '-- ============================================'.PHP_EOL;
        $lines[] = PHP_EOL;
        $lines[] = 'SET FOREIGN_KEY_CHECKS = 0;'.PHP_EOL;
        $lines[] = 'SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";'.PHP_EOL;
        $lines[] = 'SET AUTOCOMMIT = 0;'.PHP_EOL;
        $lines[] = PHP_EOL;

        foreach ($this->tables() as $table) {
            $tableEscaped = $this->quoteIdentifier($table);

            $create = DB::selectOne('SHOW CREATE TABLE '.$tableEscaped);
            $createSql = is_object($create) ? ($create->{'Create Table'} ?? '') : '';

            $lines[] = '-- --------------------------------------------'.PHP_EOL;
            $lines[] = '-- Tabel: '.$table.PHP_EOL;
            $lines[] = '-- --------------------------------------------'.PHP_EOL;
            $lines[] = 'DROP TABLE IF EXISTS '.$tableEscaped.';'.PHP_EOL;
            $lines[] = $createSql.';'.PHP_EOL;
            $lines[] = PHP_EOL;

            $rows = DB::table($table)->get();
            if ($rows->isEmpty()) {
                $lines[] = PHP_EOL;
                continue;
            }

            $pdo = DB::connection()->getPdo();
            $lines[] = 'LOCK TABLES '.$tableEscaped.' WRITE;'.PHP_EOL;

            $columnNames = array_keys((array) $rows->first());
            $columnList = implode(', ', array_map([$this, 'quoteIdentifier'], $columnNames));

            foreach ($rows as $row) {
                $values = [];
                foreach ((array) $row as $value) {
                    $values[] = $this->sqlValue($value, $pdo);
                }
                $lines[] = 'INSERT INTO '.$tableEscaped.' ('.$columnList.') VALUES ('.implode(', ', $values).');'.PHP_EOL;
            }

            $lines[] = 'UNLOCK TABLES;'.PHP_EOL;
            $lines[] = PHP_EOL;
        }

        $lines[] = 'SET FOREIGN_KEY_CHECKS = 1;'.PHP_EOL;
        $lines[] = 'COMMIT;'.PHP_EOL;
        $lines[] = PHP_EOL;
        $lines[] = '-- Selesai backup'.PHP_EOL;

        return implode('', $lines);
    }

    private function executeSqlDump(string $sql): void
    {
        $pdo = DB::connection()->getPdo();
        $pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);

        // Split by semicolons but not within strings — process line by line
        $lines = explode("\n", $sql);
        $buffer = '';
        $inMultiLineInsert = false;

        foreach ($lines as $line) {
            $trimmed = ltrim($line);

            // Skip comments and empty lines
            if ($trimmed === '' || str_starts_with($trimmed, '--') || str_starts_with($trimmed, '/*')) {
                continue;
            }

            $buffer .= $line."\n";

            // Execute when we hit a semicolon at end of meaningful content
            if (str_ends_with(rtrim($buffer), ';')) {
                $stmt = trim($buffer);
                if ($stmt !== '' && $stmt !== ';') {
                    try {
                        $pdo->exec($stmt);
                    } catch (\Throwable $e) {
                        // Log but continue — some statements may fail on re-run
                        report($e);
                    }
                }
                $buffer = '';
            }
        }

        // Execute any remaining buffer
        if (trim($buffer) !== '') {
            try {
                $pdo->exec(trim($buffer));
            } catch (\Throwable $e) {
                report($e);
            }
        }
    }

    private function tables(): array
    {
        $tables = [];
        foreach (DB::select('SHOW TABLES') as $row) {
            $values = array_values((array) $row);
            $tables[] = (string) ($values[0] ?? '');
        }

        return array_values(array_filter($tables, function (string $table) {
            return ! in_array($table, self::EXCLUDED_TABLES, true);
        }));
    }

    private function quoteIdentifier(string $identifier): string
    {
        return '`'.str_replace('`', '``', $identifier).'`';
    }

    private function sqlValue(mixed $value, \PDO $pdo): string
    {
        if ($value === null) {
            return 'NULL';
        }
        if (is_bool($value)) {
            return $value ? '1' : '0';
        }
        if (is_int($value) || is_float($value)) {
            return (string) $value;
        }

        return $pdo->quote((string) $value);
    }

    // ------------------------------------------------------------------
    // ZIP helpers
    // ------------------------------------------------------------------

    private function addDirectoryToZip(ZipArchive $zip, string $directory, string $prefix): void
    {
        $files = File::allFiles($directory);
        foreach ($files as $file) {
            $relativePath = $prefix.ltrim(str_replace($directory, '', $file->getPathname()), DIRECTORY_SEPARATOR);
            $relativePath = str_replace(DIRECTORY_SEPARATOR, '/', $relativePath);
            $zip->addFile($file->getPathname(), $relativePath);
        }
    }

    private function copyDirectory(string $source, string $destination): void
    {
        if (! is_dir($destination)) {
            File::makeDirectory($destination, 0755, true, true);
        }

        $items = File::allFiles($source);
        foreach ($items as $item) {
            $relativePath = ltrim(str_replace($source, '', $item->getPathname()), DIRECTORY_SEPARATOR);
            $destPath = $destination.DIRECTORY_SEPARATOR.$relativePath;
            $destDir = dirname($destPath);

            if (! is_dir($destDir)) {
                File::makeDirectory($destDir, 0755, true, true);
            }

            File::copy($item->getPathname(), $destPath);
        }
    }

    private function removeDirectory(string $directory): void
    {
        if (! is_dir($directory)) {
            return;
        }

        $items = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($directory, \RecursiveDirectoryIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::CHILD_FIRST,
        );

        foreach ($items as $item) {
            if ($item->isDir()) {
                rmdir($item->getPathname());
            } else {
                unlink($item->getPathname());
            }
        }

        rmdir($directory);
    }

    // ------------------------------------------------------------------
    // File helpers
    // ------------------------------------------------------------------

    private function info(string $filename): array
    {
        $path = Storage::disk(self::DISK)->path(self::DIRECTORY.'/'.$filename);

        return [
            'name' => $filename,
            'size' => (int) filesize($path),
            'created_at' => date('c', filemtime($path)),
        ];
    }

    private function prune(): void
    {
        $backups = $this->list();
        if (count($backups) <= self::MAX_BACKUPS) {
            return;
        }

        foreach (array_slice($backups, self::MAX_BACKUPS) as $backup) {
            Storage::disk(self::DISK)->delete(self::DIRECTORY.'/'.$backup['name']);
        }
    }

    private function ensureDirectory(): void
    {
        Storage::disk(self::DISK)->makeDirectory(self::DIRECTORY);
    }

    private function root(): string
    {
        return Storage::disk(self::DISK)->path(self::DIRECTORY);
    }
}
