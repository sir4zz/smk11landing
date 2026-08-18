<?php

namespace App\Http\Controllers;

use App\Models\Guru;
use App\Models\MadingPost;
use App\Models\OsisAccount;
use App\Models\Profile;
use App\Models\SdmGuru;
use App\Models\SdmTendik;
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

        // Fallback: SDM guru records not linked to a login account.
        if (! $guru) {
            $sdm = $this->resolveSdm(SdmGuru::class, $identifier);
            if ($sdm) {
                return response()->json([
                    'data' => $this->sdmPublic($sdm, 'guru'),
                    'error' => null,
                ]);
            }

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

    public function tendik(Request $request, string $identifier)
    {
        $sdm = $this->resolveSdm(SdmTendik::class, $identifier);

        if (! $sdm) {
            return response()->json(null, 404);
        }

        return response()->json([
            'data' => $this->sdmPublic($sdm, 'tendik'),
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

        // Publik 100% dari SDM: seluruh guru diambil dari data SDM (termasuk
        // yang punya akun login) supaya tidak ada data contoh/ganda dari tabel
        // lama.
        $sdmGurus = SdmGuru::query()
            ->where('is_active', true)
            ->orderBy('name', 'asc')
            ->get()
            ->map(fn (SdmGuru $guru) => [
                'role' => 'guru',
                'slug' => $guru->id,
                'name' => $guru->name,
                'photo' => $guru->photo ?? '',
                'position' => $guru->jabatan,
                'subject' => $guru->jabatan,
            ]);

        $tendiks = SdmTendik::query()
            ->where('is_active', true)
            ->orderBy('name', 'asc')
            ->get()
            ->map(fn (SdmTendik $tendik) => [
                'role' => 'tendik',
                'slug' => $tendik->id,
                'name' => $tendik->name,
                'photo' => $tendik->photo ?? '',
                'position' => $tendik->jabatan,
                'subject' => $tendik->jabatan,
            ]);

        return response()->json([
            'data' => [
                'gurus' => $sdmGurus->values(),
                'siswa' => $siswa,
                'osis' => $osis,
                'tendiks' => $tendiks,
            ],
            'error' => null,
        ]);
    }

    /**
     * Jajaran pimpinan sekolah (kepala sekolah, wakil kepala sekolah, dan
     * kepala program keahlian) yang diambil 100% dari data SDM guru melalui
     * tugas tambahan mereka.
     */
    public function leadership()
    {
        $gurus = SdmGuru::query()
            ->where('is_active', true)
            ->with('assignments')
            ->orderBy('name', 'asc')
            ->get();

        $matches = function ($rows, string $needle) {
            return $rows->filter(fn (SdmGuru $guru) => $guru->assignments->contains(
                fn ($a) => $a->jenis === \App\Models\SdmAssignment::JENIS_TUGAS_TAMBAHAN
                    && stripos((string) $a->uraian, $needle) !== false
            ))->values();
        };

        $entry = function (SdmGuru $guru): array {
            $structural = $guru->assignments->first(
                fn ($a) => $a->jenis === \App\Models\SdmAssignment::JENIS_TUGAS_TAMBAHAN
            );

            return [
                'role' => 'guru',
                'slug' => $guru->id,
                'name' => $guru->name,
                'photo' => $guru->photo ?? '',
                'position' => $guru->jabatan,
                'title' => $structural ? $structural->uraian : ($guru->jabatan ?? ''),
                'subject' => $guru->assignments
                    ->filter(fn ($a) => $a->jenis === \App\Models\SdmAssignment::JENIS_TUGAS_MENGAJAR)
                    ->pluck('uraian')
                    ->unique()
                    ->values()
                    ->implode(', '),
                'bio' => $guru->bio ?? '',
            ];
        };

        $principal = $matches($gurus, 'KEPALA SEKOLAH')->first();

        return response()->json([
            'data' => [
                'principal' => $principal ? $entry($principal) : null,
                'vice_principals' => $matches($gurus, 'WAKASEK')->map($entry),
                'program_heads' => $matches($gurus, 'KEPALA KONSENTRASI')->map($entry),
            ],
            'error' => null,
        ]);
    }

    private function resolveSdm(string $model, string $identifier): ?object
    {
        return $model::query()
            ->where('is_active', true)
            ->where(function ($q) use ($identifier) {
                $q->where('id', $identifier)
                    ->orWhere('nip', $identifier)
                    ->orWhere('nipppk', $identifier)
                    ->orWhere('nuptk', $identifier)
                    ->orWhere('nik', $identifier);
            })
            ->first();
    }

    /**
     * Public-safe SDM profile. Sensitive/kepegawaian fields (NIK, NPWP, BPJS,
     * gaji, KGB, nomor SK, sertifikat, dokumen pribadi) are never exposed.
     */
    private function sdmPublic(object $record, string $role): array
    {
        $jabatan = $record->jabatan;
        $bidang = $record->assignments
            ->filter(fn ($a) => $a->jenis === \App\Models\SdmAssignment::JENIS_TUGAS_MENGAJAR)
            ->pluck('uraian')
            ->unique()
            ->values();

        return [
            'role' => $role,
            'slug' => $record->id,
            'name' => $record->name,
            'photo' => $record->photo ?? '',
            'position' => $jabatan,
            'subject' => $bidang->implode(', '),
            'bio' => $record->bio ?? '',
            'email' => $record->email ?? '',
            'phone' => $record->phone ?? '',
            'social' => [
                'instagram' => $record->instagram ?? '',
                'facebook' => $record->facebook ?? '',
                'twitter' => $record->twitter ?? '',
                'tiktok' => $record->tiktok ?? '',
                'youtube' => $record->youtube ?? '',
                'linkedin' => $record->linkedin ?? '',
                'website' => $record->website ?? '',
                'github' => $record->github ?? '',
            ],
            'education' => $record->educations->map(fn ($e) => [
                'jenjang' => $e->jenjang,
                'jurusan' => $e->jurusan,
                'perguruan_tinggi' => $e->perguruan_tinggi,
                'tahun_lulus' => $e->tahun_lulus,
            ]),
            'assignments' => $record->assignments->map(fn ($a) => [
                'jenis' => $a->jenis,
                'uraian' => $a->uraian,
                'jumlah_jam' => $a->jumlah_jam,
            ]),
            'certified' => $record->certifications->isNotEmpty(),
        ];
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
