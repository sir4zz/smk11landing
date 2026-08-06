<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UploadController extends Controller
{
    public function upload(Request $request)
    {
        $request->validate([
            'file' => ['required', 'file', 'image', 'max:51200'],
        ]);

        $file = $request->file('file');

        $key = 'photos/'.now()->format('Y/m').'/'.uniqid().'-'.preg_replace('/[^a-zA-Z0-9._-]/', '-', $file->getClientOriginalName());

        Storage::disk('public')->putFileAs(
            dirname($key),
            $file,
            basename($key),
        );

        $url = Storage::disk('public')->url($key);

        return response()->json([
            'data' => [
                'bucket' => 'photos',
                'key' => $key,
                'size' => $file->getSize(),
                'mimeType' => $file->getMimeType(),
                'uploadedAt' => now()->toIso8601String(),
                'url' => $url,
            ],
            'error' => null,
        ]);
    }

    public function destroy(Request $request)
    {
        $request->validate(['paths' => ['required', 'array']]);
        foreach ($request->input('paths') as $path) {
            Storage::disk('public')->delete((string) $path);
        }
        return response()->json(['data' => null, 'error' => null]);
    }

    public function url(Request $request)
    {
        $request->validate(['path' => ['required', 'string']]);
        return response()->json(['data' => ['url' => Storage::url($request->query('path'))], 'error' => null]);
    }
}
