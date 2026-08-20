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

        $mimeType = $imagePath ? $imagePath->getMimeType() : $file->getMimeType();

        if ($imagePath) {
            @unlink($imagePath->getPathname());
        }

        $url = '/storage/'.$key;

        return response()->json([
            'data' => [
                'bucket' => $bucket,
                'key' => $key,
                'size' => Storage::disk('public')->size($key),
                'mimeType' => $mimeType,
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
        $ext = strtolower($file->getClientOriginalExtension());

        $src = match ($ext) {
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

        // Preserve transparency for PNG and GIF
        if (in_array($ext, ['png', 'gif'], true)) {
            imagealphablending($dst, false);
            imagesavealpha($dst, true);
            $transparent = imagecolorallocatealpha($dst, 0, 0, 0, 127);
            imagefilledrectangle($dst, 0, 0, $nw, $nh, $transparent);
        }

        imagecopyresampled($dst, $src, 0, 0, 0, 0, $nw, $nh, $w, $h);

        $tmp = tempnam(sys_get_temp_dir(), 'img');
        $savedSize = null;

        // Save in original format to preserve transparency
        $saved = match ($ext) {
            'png' => imagepng($dst, $tmp, 6), // compression level 6
            'gif' => imagegif($dst, $tmp),
            'webp' => imagewebp($dst, $tmp, $quality),
            default => imagejpeg($dst, $tmp, $quality),
        };

        if ($saved) {
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

        $outputMime = match ($ext) {
            'png' => 'image/png',
            'gif' => 'image/gif',
            'webp' => 'image/webp',
            default => 'image/jpeg',
        };

        $optimized = new \Symfony\Component\HttpFoundation\File\UploadedFile(
            $tmp,
            $file->getClientOriginalName(), // keep original filename + extension
            $outputMime,
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
