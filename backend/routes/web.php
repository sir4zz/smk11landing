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

Route::get('/', function () {
    return view('welcome');
});

Route::get('/login', function () {
    return redirect('/admin/login');
})->name('login');
