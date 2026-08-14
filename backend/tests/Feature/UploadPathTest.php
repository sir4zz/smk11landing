<?php

namespace Tests\Feature;

use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class UploadPathTest extends TestCase
{
    use RefreshDatabase;

    public function test_upload_returns_a_relative_storage_path(): void
    {
        Storage::fake('public');
        $user = User::create([
            'email' => 'uploader@example.test',
            'password' => Hash::make('password'),
            'name' => 'Uploader',
        ]);
        Profile::create(['id' => $user->id, 'role' => 'admin', 'name' => 'Uploader', 'email' => $user->email]);

        $response = $this->actingAs($user)->postJson('/api/upload', [
            'file' => UploadedFile::fake()->image('photo.jpg'),
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.url', fn (string $url): bool => str_starts_with($url, '/storage/photos/'));
        $this->assertStringNotContainsString('://', $response->json('data.url'));
    }
}
