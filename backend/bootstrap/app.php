<?php

use App\Http\Middleware\AdminOnly;
use App\Http\Middleware\CheckPermission;
use App\Http\Middleware\StaffOnly;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        apiPrefix: 'api',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'permission' => CheckPermission::class,
            'admin' => AdminOnly::class,
            'staff' => StaffOnly::class,
        ]);

        $middleware->statefulApi();

        $middleware->trustProxies(at: '*');

        $middleware->remove(\Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull::class);

        // SPA cookie auth: every API route needs a session store so
        // Sanctum's session guard + /api/auth/me work regardless of Origin.
        $middleware->api(append: [
            \Illuminate\Session\Middleware\StartSession::class,
        ]);

        // SPA cookie auth: API endpoints rely on the session cookie set by
        // /api/auth/login; the React client uses the same login flow.
        $middleware->validateCsrfTokens(except: ['api/*']);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (Throwable $e) {
            //
        });
    })->create();
