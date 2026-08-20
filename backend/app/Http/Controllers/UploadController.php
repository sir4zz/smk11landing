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
            'bucket' => ['nullable', 'string', 'regex:/^[a-zA-Z0-9\-\/_]+$/'],
        ]);

        $file = $request->file('file');

        $bucket = $request->input('bucket', 'photos');
        $bucket = trim($bucket, '/');
        // Sanitasi / cegah path traversal, hanya izinkan folder yang dikenal.
        $allowed = ['photos', 'bkk/logos', 'spmb/posters', 'gallery/covers', 'gallery/images', 'mading', 'osis', 'extracurriculars', 'kesemaptaan', 'program-keahlian', 'student/documents'];
        if (!in_array($bucket, $allowed, true)) {
            $bucket = 'photos';
        }

        $key = $bucket.'/'.now()->format('Y/m').'/'.uniqid().'-'.preg_replace('/[^a-zA-Z0-9._-]/', '-', $file->getClientOriginalName());

        // Logo program keahlian diunggah apa adanya agar transparansi PNG tetap terjaga.
        $imagePath = $bucket === 'program-keahlian' ? null : $this->optimizeImage($file);
        if ($imagePath) {
            $key = $bucket.'/'.now()->format('Y/m').'/'.uniqid().'-'.preg_replace('/[^a-zA-Z0-9._-]/', '-', $imagePath->getClientOriginalName());
        }

        Storage::disk('public')->putFileAs(
            dirname($key),
            $imagePath ?: $file,
            basename($key),
        );

        if ($imagePath) {
            @unlink($imagePath->getPathname());
        }

        $url = '/storage/'.$key;

        return response()->json([
            'data' => [
                'bucket' => $bucket,
                'key' => $key,
                'size' => Storage::disk('public')->size($key),
                'mimeType' => $imagePath ? 'image/jpeg' : $file->getMimeType(),
                'uploadedAt' => now()->toIso8601String(),
                'url' => $url,
            ],
            'error' => null,
        ]);
    }

    private function optimizeImage($file)
    {
        $maxDim = 1600;
        $quality = 82;

        $src = match (strtolower($file->getClientOriginalExtension())) {
            'png' => @imagecreatefrompng($file->getPathname()),
            'gif' => @imagecreatefromgif($file->getPathname()),
            'webp' => @imagecreatefromwebp($file->getPathname()),
            default => @imagecreatefromjpeg($file->getPathname()),
        };
        if ($src === false) {
            return null;
        }

        $w = imagesx($src);
        $h = imagesy($src);
        $ratio = min(1, $maxDim / max($w, $h));
        $nw = (int) round($w * $ratio);
        $nh = (int) round($h * $ratio);
        $dst = imagecreatetruecolor(max(1, $nw), max(1, $nh));
        imagecopyresampled($dst, $src, 0, 0, 0, 0, $nw, $nh, $w, $h);

        $tmp = tempnam(sys_get_temp_dir(), 'img');
        $savedSize = null;
        if (imagejpeg($dst, $tmp, $quality)) {
            $savedSize = filesize($tmp);
        }
        imagedestroy($src);
        imagedestroy($dst);

        if ($savedSize === null) {
            @unlink($tmp);
            return null;
        }
        if ($savedSize >= $file->getSize()) {
            @unlink($tmp);
            return null;
        }

        $optimized = new \Symfony\Component\HttpFoundation\File\UploadedFile(
            $tmp,
            preg_replace('/\.(png|gif|webp)$/i', '.jpg', $file->getClientOriginalName()),
            'image/jpeg',
            null,
            true
        );

        return $optimized;
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
