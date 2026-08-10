<?php

namespace Tests\Unit;

use App\Models\Profile;
use App\Models\User;
use App\Services\MadingAiService;
use App\Services\PermissionService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class MadingAiRateLimitTest extends TestCase
{
    public function test_first_daily_request_is_stored_in_cache(): void
    {
        $user = $this->userWithRole('student');

        Cache::shouldReceive('has')->once()->andReturnFalse();
        Cache::shouldReceive('put')->once()->withArgs(fn ($key, $value, $expiry): bool =>
            $key === 'mading_ai:'.$user->id.':'.now()->format('Y-m-d') && $value === 1
        );

        app(MadingAiService::class)->assertRateLimit($user);
    }

    public function test_daily_limit_rejects_requests_at_the_limit(): void
    {
        $user = $this->userWithRole('student');

        Cache::shouldReceive('has')->once()->andReturnTrue();
        Cache::shouldReceive('get')->once()->andReturn(30);
        Cache::shouldReceive('increment')->never();

        $this->expectException(ValidationException::class);

        app(MadingAiService::class)->assertRateLimit($user);
    }

    private function userWithRole(string $role): User
    {
        $user = new User;
        $user->id = 'rate-limit-user';
        $user->setRelation('profileRecord', (new Profile)->forceFill(['role' => $role]));

        return $user;
    }
}
