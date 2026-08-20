<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Pure-PHP MySQL dump generator and backup file manager.
 * Backups are stored under storage/app/backups as .sql files.
 */
class DatabaseBackupService
{
    private const DISK = 'local';
    private const DIRECTORY = 'backups';
    private const FILENAME_PATTERN = '/^[A-Za-z0-9._-]+\.sql$/';

    /** Keep only the latest N backups on disk to avoid bloat. */
    public const MAX_BACKUPS = 30;

    public function list(): array
    {
        $root = $this->root();
        if (! is_dir($root)) {
            return [];
        }

        $files = [];
        foreach (glob($root.'/*.sql') ?: [] as $file) {
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

        $name = 'smkn11-'.now()->format('Ymd-His').'-'.Str::lower(Str::random(4)).'.sql';
        Storage::disk(self::DISK)->put(self::DIRECTORY.'/'.$name, $this->dumpSql());

        $this->prune();

        return $this->info($name);
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
        $lines[] = '-- SMKN 11 Website - Backup Database'.PHP_EOL;
        $lines[] = '-- Dibuat: '.now()->toDateTimeString().PHP_EOL;
        $lines[] = '-- Database: '.DB::connection()->getDatabaseName().PHP_EOL;
        $lines[] = '-- ============================================'.PHP_EOL;
        $lines[] = PHP_EOL;
        $lines[] = 'SET FOREIGN_KEY_CHECKS = 0;'.PHP_EOL;

        foreach ($this->tables() as $table) {
            $tableEscaped = $this->quoteIdentifier($table);

            $create = DB::selectOne('SHOW CREATE TABLE '.$tableEscaped);
            $createSql = is_object($create) ? ($create->{'Create Table'} ?? '') : '';

            $lines[] = 'DROP TABLE IF EXISTS '.$tableEscaped.';'.PHP_EOL;
            $lines[] = $createSql.';'.PHP_EOL;
            $lines[] = PHP_EOL;

            $rows = DB::table($table)->get();
            if ($rows->isEmpty()) {
                continue;
            }

            $pdo = DB::connection()->getPdo();
            $lines[] = 'LOCK TABLES '.$tableEscaped.' WRITE;'.PHP_EOL;

            foreach ($rows as $row) {
                $values = [];
                foreach ((array) $row as $value) {
                    $values[] = $this->sqlValue($value, $pdo);
                }
                $lines[] = 'INSERT INTO '.$tableEscaped.' VALUES ('.implode(', ', $values).');'.PHP_EOL;
            }

            $lines[] = 'UNLOCK TABLES;'.PHP_EOL;
            $lines[] = PHP_EOL;
        }

        $lines[] = 'SET FOREIGN_KEY_CHECKS = 1;'.PHP_EOL;

        return implode('', $lines);
    }

    private function tables(): array
    {
        $tables = [];
        foreach (DB::select('SHOW TABLES') as $row) {
            $values = array_values((array) $row);
            $tables[] = (string) ($values[0] ?? '');
        }

        return array_values(array_filter($tables));
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