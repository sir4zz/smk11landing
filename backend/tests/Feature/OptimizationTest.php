<?php

namespace Tests\Feature;

use App\Models\Gallery;
use App\Models\AlumniGraduation;
use App\Models\Extracurricular;
use App\Models\OsisActivity;
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

    public function test_alumni_graduations_are_not_publicly_readable(): void
    {
        AlumniGraduation::create(['name' => 'Private Alumni', 'nisn' => '123']);

        $this->getJson('/api/data/alumni_graduations')
            ->assertUnauthorized();
    }

    public function test_public_activity_endpoints_hide_drafts(): void
    {
        OsisActivity::create(['title' => 'Draft OSIS', 'status' => 'draft']);
        OsisActivity::create(['title' => 'Published OSIS', 'status' => 'published']);
        Extracurricular::create(['name' => 'Draft Ekstra', 'slug' => 'draft-ekstra', 'status' => 'draft']);
        Extracurricular::create(['name' => 'Published Ekstra', 'slug' => 'published-ekstra', 'status' => 'published']);

        $this->getJson('/api/osis/activities')->assertJsonCount(1)->assertJsonPath('0.title', 'Published OSIS');
        $this->getJson('/api/extracurriculars')->assertJsonCount(1)->assertJsonPath('0.slug', 'published-ekstra');
        $this->getJson('/api/extracurriculars/draft-ekstra')->assertNotFound();
        $this->getJson('/api/data/osis_activities')->assertJsonPath('data.0.title', 'Published OSIS');
    }
}
