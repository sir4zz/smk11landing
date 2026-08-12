<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

Route::get('/storage/{path}', function (string $path) {
    foreach (['public', 'local'] as $disk) {
        $storagePath = Storage::disk($disk)->path($disk === 'local' ? 'public/'.$path : $path);
        if (is_file($storagePath)) {
            $response = response()->file($storagePath);
            // Uploaded files keep their unique names and never change,
            // so a long-lived browser cache is safe and saves bandwidth.
            $response->headers->set('Cache-Control', 'public, max-age=86400');
            return $response;
        }
    }

    abort(404);
})->where('path', '.*');

Route::get('/', function () {
    return view('welcome');
});
