<?php

namespace App\Http\Controllers;

use App\Models\Guru;
use App\Models\MadingPost;
use App\Models\OsisAccount;
use App\Models\Profile;
use App\Models\Student;
use Illuminate\Http\Request;

/**
 * Public profile pages for guru, siswa and OSIS members. Read-only, no auth.
 */
class PublicProfileController extends Controller
{
    public function guru(Request $request, string $identifier)
    {
        $guru = Guru::query()
            ->where('teacher_id', $identifier)
            ->orWhere('nip', $identifier)
            ->orWhere('nuptk', $identifier)
            ->first();

        if (! $guru) {
            return response()->json(null, 404);
        }

        $profile = Profile::query()->find($guru->id);

        return response()->json([
            'data' => [
                'role' => 'guru',
                'slug' => $guru->teacher_id,
                'name' => $profile?->name ?: $guru->user?->name,
                'photo' => $profile?->photo ?? '',
                'position' => $guru->position,
                'subject' => $guru->subject,
                'bio' => $profile?->bio ?? '',
                'email' => $profile?->email ?? '',
                'phone' => $profile?->phone ?? '',
                'address' => $profile?->address ?? '',
                'social' => $this->social($profile),
                'achievements' => $guru->achievements ?? [],
                'certifications' => $guru->certifications ?? [],
            ],
            'error' => null,
        ]);
    }

    public function siswa(Request $request, string $identifier)
    {
        $student = Student::query()->where('nisn', $identifier)->first();

        if (! $student) {
            return response()->json(null, 404);
        }

        $profile = Profile::query()->find($student->id);
        $user = $student->user;

        $works = MadingPost::query()
            ->where('author_id', $student->id)
            ->where('status', 'published')
            ->orderByDesc('published_at')
            ->get(['title', 'category_id', 'content', 'cover_image', 'published_at'])
            ->map(fn ($post) => [
                'title' => $post->title,
                'content' => $post->content,
                'cover_image' => $post->cover_image,
                'category_id' => $post->category_id,
                'published_at' => $post->published_at?->toIso8601String(),
            ]);

        return response()->json([
            'data' => [
                'role' => 'siswa',
                'slug' => $student->nisn,
                'nisn' => $student->nisn,
                'name' => $student->name,
                'photo' => $student->foto ?? '',
                'class' => $student->class,
                'major' => $student->major,
                'bio' => $profile?->bio ?? '',
                // Login email is derived from NISN and must not be public.
                'email' => $profile?->email ?? '',
                'phone' => $student->phone ?? '',
                'address' => $student->address ?? '',
                'social' => $this->social($profile),
                'achievements' => $student->achievements ?? [],
                'works' => $works,
            ],
            'error' => null,
        ]);
    }

    public function osis(Request $request, string $identifier)
    {
        $account = OsisAccount::query()
            ->where('member_id', $identifier)
            ->orWhere('nisn', $identifier)
            ->first();

        if (! $account) {
            return response()->json(null, 404);
        }

        $profile = Profile::query()->find($account->id);

        return response()->json([
            'data' => [
                'role' => 'osis',
                'slug' => $account->member_id,
                'member_id' => $account->member_id,
                'nisn' => $account->nisn,
                'name' => $profile?->name ?: $account->user?->name,
                'photo' => $profile?->photo ?? '',
                'division' => $account->division,
                'position' => $account->position,
                'bio' => $profile?->bio ?? '',
                'email' => $profile?->email ?? '',
                'phone' => $profile?->phone ?? '',
                'address' => $profile?->address ?? '',
                'social' => $this->social($profile),
                'achievements' => $account->achievements ?? [],
                'work_programs' => $account->work_programs ?? [],
            ],
            'error' => null,
        ]);
    }

    public function directory()
    {
        $gurus = Guru::query()
            ->with('user.profileRecord')
            ->orderBy('position', 'asc')
            ->get()
            ->map(fn (Guru $guru) => [
                'role' => 'guru',
                'slug' => $guru->teacher_id,
                'name' => $guru->user->profileRecord?->name ?: $guru->user->name,
                'photo' => $guru->user->profileRecord?->photo ?? '',
                'position' => $guru->position,
                'subject' => $guru->subject,
            ]);

        $siswa = Student::query()
            ->with('user.profileRecord')
            ->orderBy('name', 'asc')
            ->get()
            ->map(fn (Student $student) => [
                'role' => 'siswa',
                'slug' => $student->nisn,
                'name' => $student->name,
                'photo' => $student->foto ?? '',
                'class' => $student->class,
                'major' => $student->major,
            ]);

        $osis = OsisAccount::query()
            ->with('user.profileRecord')
            ->orderBy('position', 'asc')
            ->get()
            ->map(fn (OsisAccount $account) => [
                'role' => 'osis',
                'slug' => $account->member_id,
                'name' => $account->user->profileRecord?->name ?: $account->user->name,
                'photo' => $account->user->profileRecord?->photo ?? '',
                'position' => $account->position,
                'division' => $account->division,
            ]);

        return response()->json([
            'data' => [
                'gurus' => $gurus,
                'siswa' => $siswa,
                'osis' => $osis,
            ],
            'error' => null,
        ]);
    }

    private function social(?Profile $profile): array
    {
        return [
            'instagram' => $profile?->instagram ?? '',
            'facebook' => $profile?->facebook ?? '',
            'twitter' => $profile?->twitter ?? '',
            'tiktok' => $profile?->tiktok ?? '',
            'youtube' => $profile?->youtube ?? '',
            'linkedin' => $profile?->linkedin ?? '',
            'website' => $profile?->website ?? '',
            'github' => $profile?->github ?? '',
        ];
    }
}
