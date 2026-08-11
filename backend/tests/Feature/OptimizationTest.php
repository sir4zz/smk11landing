<?php

namespace Tests\Feature;

use App\Models\Gallery;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class OptimizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_stats_are_read_from_cache(): void
    {
        Cache::shouldReceive('remember')
            ->once()
            ->withArgs(fn (string $key, $ttl, callable $resolver): bool => $key === 'public:stats')
            ->andReturn(['data' => [['value' => 'cached', 'label' => 'Siswa Aktif']]]);

        $this->getJson('/api/stats')
            ->assertOk()
            ->assertJson(['data' => [['value' => 'cached', 'label' => 'Siswa Aktif']]]);

    }

    public function test_public_content_response_is_cached(): void
    {
        Cache::shouldReceive('get')->once()->andReturn(1);
        Cache::shouldReceive('remember')
            ->once()
            ->withArgs(fn (string $key, $ttl, callable $resolver): bool => str_starts_with($key, 'public:content:news:'))
            ->andReturn([]);

        $this->getJson('/api/news')
            ->assertOk()
            ->assertJson([]);
    }

    public function test_public_gallery_limit_is_capped_at_sixty(): void
    {
        foreach (range(1, 61) as $number) {
            Gallery::create([
                'title' => "Gallery {$number}",
                'slug' => "gallery-{$number}",
                'is_published' => true,
            ]);
        }

        $this->getJson('/api/galleries?limit=999')
            ->assertOk()
            ->assertJsonPath('meta.limit', 60)
            ->assertJsonCount(60, 'data');
    }

    public function test_public_api_routes_do_not_start_a_session(): void
    {
        $apiStatsRoute = collect(app('router')->getRoutes()->getRoutes())
            ->first(fn ($candidate) => $candidate->uri() === 'api/stats');

        $this->assertNotNull($apiStatsRoute);
        $this->assertNotContains(
            \Illuminate\Session\Middleware\StartSession::class,
            $apiStatsRoute->gatherMiddleware()
        );
    }

    public function test_rate_limited_endpoints_have_named_throttles(): void
    {
        $routes = collect(app('router')->getRoutes()->getRoutes());

        $this->assertContains('throttle:auth', $routes->first(fn ($route) => $route->uri() === 'api/auth/login')->gatherMiddleware());
        $this->assertContains('throttle:contact', $routes->first(fn ($route) => $route->uri() === 'api/contact')->gatherMiddleware());
        $this->assertContains('throttle:mading-ai', $routes->first(fn ($route) => $route->uri() === 'api/mading/ai/generate')->gatherMiddleware());
    }
}
