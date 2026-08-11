<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('auth', fn () => Limit::perMinute(5)->by(request()->ip()));
        RateLimiter::for('contact', fn () => Limit::perMinute(5)->by(request()->ip()));
        RateLimiter::for('upload', fn () => Limit::perMinute(20)->by(request()->user()?->id ?: request()->ip()));
        RateLimiter::for('proxy', fn () => Limit::perMinute(10)->by(request()->user()?->id ?: request()->ip()));
        RateLimiter::for('mading-ai', fn () => Limit::perMinute(10)->by(request()->user()?->id ?: request()->ip()));
    }
}
