<?php

namespace App\Http\Controllers;

use App\Services\DatabaseBackupService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class DatabaseBackupController extends Controller
{
    private string $chunkDir;

    public function __construct(protected DatabaseBackupService $backups)
    {
        $this->chunkDir = storage_path('app/private/backups/chunks');
        if (! File::isDirectory($this->chunkDir)) {
            File::makeDirectory($this->chunkDir, 0755, true);
        }
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

    public function restore(Request $request)
    {
        $request->validate([
            'backup_file' => 'required|file|mimes:zip|max:102400',
        ]);

        $uploadedFile = $request->file('backup_file');
        $tempPath = $uploadedFile->getRealPath();

        try {
            $result = $this->backups->restore($tempPath);

            return response()->json(['data' => $result]);
        } catch (\Throwable $e) {
            report($e);

            $message = config('app.debug')
                ? 'Gagal melakukan restore: '.$e->getMessage()
                : 'Gagal melakukan restore. File backup mungkin corrupt.';

            return response()->json(['error' => ['message' => $message]], 500);
        }
    }

    public function uploadChunk(Request $request)
    {
        $request->validate([
            'chunk' => 'required|file|max:2048',
            'upload_id' => 'required|string',
            'chunk_index' => 'required|integer|min:0',
            'total_chunks' => 'required|integer|min:1',
            'filename' => 'required|string',
        ]);

        $uploadId = $request->input('upload_id');
        $chunkIndex = (int) $request->input('chunk_index');
        $safeDir = $this->chunkDir.'/'.preg_replace('/[^a-f0-9-]/', '', $uploadId);

        if (! File::isDirectory($safeDir)) {
            File::makeDirectory($safeDir, 0755, true);
        }

        $chunkPath = $safeDir.'/'.str_pad($chunkIndex, 6, '0', STR_PAD_LEFT);
        $request->file('chunk')->move($safeDir, basename($chunkPath));

        return response()->json([
            'data' => [
                'uploaded' => true,
                'chunk' => $chunkIndex,
                'total' => (int) $request->input('total_chunks'),
            ],
        ]);
    }

    public function restoreCommit(Request $request)
    {
        $request->validate([
            'upload_id' => 'required|string',
            'total_chunks' => 'required|integer|min:1',
            'filename' => 'required|string',
        ]);

        $uploadId = $request->input('upload_id');
        $safeDir = $this->chunkDir.'/'.preg_replace('/[^a-f0-9-]/', '', $uploadId);

        if (! File::isDirectory($safeDir)) {
            return response()->json(['error' => ['message' => 'Upload session tidak ditemukan. Silakan upload ulang.']], 422);
        }

        $totalChunks = (int) $request->input('total_chunks');
        $collected = collect();
        for ($i = 0; $i < $totalChunks; $i++) {
            $chunkPath = $safeDir.'/'.str_pad($i, 6, '0', STR_PAD_LEFT);
            if (! File::exists($chunkPath)) {
                return response()->json(['error' => ['message' => "Chunk {$i} tidak ditemukan. Silakan upload ulang."]], 422);
            }
            $collected->push(File::get($chunkPath));
        }

        $tmpFile = tempnam(sys_get_temp_dir(), 'restore_');
        file_put_contents($tmpFile, implode('', $collected->toArray()));

        try {
            $result = $this->backups->restore($tmpFile);

            return response()->json(['data' => $result]);
        } catch (\Throwable $e) {
            report($e);

            $message = config('app.debug')
                ? 'Gagal melakukan restore: '.$e->getMessage()
                : 'Gagal melakukan restore. File backup mungkin corrupt.';

            return response()->json(['error' => ['message' => $message]], 500);
        } finally {
            @unlink($tmpFile);
            File::deleteDirectory($safeDir);
        }
    }

    public function download(string $filename)
    {
        $path = $this->backups->path($filename);
        if (! $path) {
            return response()->json(['error' => ['message' => 'File backup tidak ditemukan.']], 404);
        }

        return response()->download($path, $filename, [
            'Content-Type' => 'application/zip',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
    }

    public function destroy(string $filename)
    {
        if (! $this->backups->delete($filename)) {
            return response()->json(['error' => ['message' => 'File backup tidak ditemukan.']], 404);
        }

        return response()->json(['data' => null, 'error' => null]);
    }
}
