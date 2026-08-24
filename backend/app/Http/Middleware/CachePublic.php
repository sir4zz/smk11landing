<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Adds browser-side Cache-Control headers to public, unauthenticated GET
 * responses whose content rarely changes. The 30s max-age matches the
 * server-side cache TTL used by the public content controllers, so browsers
 * and CDNs can reuse responses without serving stale data.
 */
class CachePublic
{
    private const PUBLIC_PREFIXES = [
        'news', 'programs', 'facilities', 'staff', 'achievements',
        'teacher-activities', 'education-staff', 'spmb', 'osis', 'extracurriculars',
        'mading/categories', 'mading/posts', 'stats', 'faqs',
        'galleries', 'gallery/categories', 'jobs', 'bkk/partners', 'public',
        'data/content_records', 'data/programs', 'data/facilities',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (! $request->isMethod('GET')) {
            return $response;
        }

        if ($request->user()) {
            return $response;
        }

        $path = $request->path();
        if (str_starts_with($path, 'api/')) {
            $path = substr($path, 4);
        }

        foreach (self::PUBLIC_PREFIXES as $prefix) {
            if ($path === $prefix || str_starts_with($path, $prefix.'/')) {
                $response->headers->set('Cache-Control', 'public, max-age=30');
                break;
            }
        }

        return $response;
    }
}
