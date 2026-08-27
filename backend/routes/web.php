<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

Route::get('/storage/{path}', function (string $path) {
    foreach (['public', 'local'] as $disk) {
        $storagePath = Storage::disk($disk)->path($disk === 'local' ? 'public/'.$path : $path);
        if (is_file($storagePath)) {
            $response = response()->file($storagePath);
            $response->headers->set('Cache-Control', 'public, max-age=86400');
            return $response;
        }
    }

    abort(404);
})->where('path', '.*');

Route::get('/login', function () {
    return redirect('/admin/login');
})->name('login');

// SPA fallback: jika frontend sudah di-build ke backend/public/index.html,
// semua rute non-API yang tidak match file fisik akan dilayani oleh SPA.
// Penting untuk hosting single-domain di aaPanel (smkn11kabtang.sch.id)
// di mana frontend React dan Laravel digabung (same-origin /api).
Route::fallback(function () {
    $spaPath = public_path('index.html');

    // Jika belum ada build SPA (dev), fallback ke welcome view / 404
    if (!is_file($spaPath)) {
        // Di production, ini berarti frontend belum di-build — tampilkan pesan jelas
        if (app()->environment('production')) {
            abort(404, 'Frontend belum di-build. Jalankan `npm run build` di root proyek.');
        }
        return view('welcome');
    }

    // Jangan intercept request ke api / storage yang seharusnya 404 via API layer
    $requestPath = request()->path();
    if (str_starts_with($requestPath, 'api/') || str_starts_with($requestPath, 'storage/')) {
        abort(404);
    }

    return response()->file($spaPath, [
        'Cache-Control' => 'no-cache, no-store, must-revalidate',
    ]);
});
