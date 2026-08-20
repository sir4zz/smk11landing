<?php

namespace App\Http\Controllers;

use App\Services\DatabaseBackupService;

class DatabaseBackupController extends Controller
{
    public function __construct(protected DatabaseBackupService $backups)
    {
    }

    public function index()
    {
        return response()->json(['data' => $this->backups->list()]);
    }

    public function store()
    {
        try {
            return response()->json(['data' => $this->backups->create()], 201);
        } catch (\Throwable $e) {
            report($e);

            $message = config('app.debug')
                ? 'Gagal membuat backup: '.$e->getMessage()
                : 'Gagal membuat backup. Silakan coba lagi.';

            return response()->json(['error' => ['message' => $message]], 500);
        }
    }

    public function download(string $filename)
    {
        $path = $this->backups->path($filename);
        if (! $path) {
            return response()->json(['error' => ['message' => 'File backup tidak ditemukan.']], 404);
        }

        return response()->download($path, $filename, ['Content-Type' => 'application/sql']);
    }

    public function destroy(string $filename)
    {
        if (! $this->backups->delete($filename)) {
            return response()->json(['error' => ['message' => 'File backup tidak ditemukan.']], 404);
        }

        return response()->json(['data' => null, 'error' => null]);
    }
}