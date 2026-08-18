<?php

namespace App\Http\Controllers;

use App\Models\SdmGuru;
use App\Models\SdmTendik;
use App\Services\SdmImportService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Admin management for the SDM module (Guru & Tenaga Kependidikan). All
 * methods expect ?type=guru|tendik so a single controller serves both main
 * record types. Protected by the sdm.* permissions in routes.
 */
class SdmController extends Controller
{
    public const TYPES = ['guru', 'tendik'];

    public function __construct(protected SdmImportService $importer)
    {
    }

    public function index(Request $request)
    {
        $type = $this->resolveType($request);
        $query = $this->model($type)::query()->with('user');

        if ($request->filled('search')) {
            $term = '%'.$request->query('search').'%';
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', $term)
                    ->orWhere('nip', 'like', $term)
                    ->orWhere('nipppk', 'like', $term)
                    ->orWhere('nuptk', 'like', $term)
                    ->orWhere('nik', 'like', $term);
            });
        }

        if ($request->filled('jabatan')) {
            $query->where('jabatan', 'like', '%'.$request->query('jabatan').'%');
        }

        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->query('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        $query->orderBy('name', 'asc');

        $perPage = max(1, min(100, (int) ($request->query('per_page', 20))));
        $page = max(1, (int) ($request->query('page', 1)));
        $total = (clone $query)->count();
        $rows = $query->forPage($page, $perPage)->get();

        return response()->json([
            'data' => [
                'type' => $type,
                'items' => $rows->map(fn ($row) => $this->brief($row)),
                'total' => $total,
                'per_page' => $perPage,
                'page' => $page,
            ],
            'error' => null,
        ]);
    }

    public function show(Request $request)
    {
        $type = $this->resolveType($request);
        $id = (string) $request->route('id');
        $record = $this->model($type)::query()
            ->with(['user', 'educations', 'assignments', 'certifications', 'kgb', 'skPengangkatans'])
            ->findOrFail($id);

        return response()->json([
            'data' => $this->detail($record),
            'error' => null,
        ]);
    }

    public function store(Request $request)
    {
        $type = $this->resolveType($request);
        $payload = $this->validatePerson($request, $type);

        $record = $this->model($type)::create($payload['main']);
        $this->syncChildren($type, $record->id, $payload['children']);

        return response()->json([
            'data' => $this->detail($record->fresh(['educations', 'assignments', 'certifications', 'kgb', 'skPengangkatans'])),
            'error' => null,
        ], 201);
    }

    public function update(Request $request)
    {
        $type = $this->resolveType($request);
        $id = (string) $request->route('id');
        $record = $this->model($type)::findOrFail($id);
        $payload = $this->validatePerson($request, $type);

        $record->update($payload['main']);
        $this->syncChildren($type, $record->id, $payload['children']);

        return response()->json([
            'data' => $this->detail($record->fresh(['educations', 'assignments', 'certifications', 'kgb', 'skPengangkatans'])),
            'error' => null,
        ]);
    }

    public function destroy(Request $request)
    {
        $type = $this->resolveType($request);
        $id = (string) $request->route('id');
        $record = $this->model($type)::findOrFail($id);

        $this->syncChildren($type, $record->id, []);
        if ($record->photo) {
            $this->deleteStoredFile($record->photo);
        }
        $record->delete();

        return response()->json(['data' => null, 'error' => null]);
    }

    public function preview(Request $request)
    {
        $type = $this->resolveType($request);
        $data = $request->validate([
            'persons' => ['required', 'array', 'min:1'],
        ]);

        return response()->json([
            'data' => $this->importer->analyzePersons($data['persons'], $type),
            'error' => null,
        ]);
    }

    public function import(Request $request)
    {
        $type = $this->resolveType($request);
        $data = $request->validate([
            'persons' => ['required', 'array', 'min:1'],
        ]);

        $result = $this->importer->importPersons($data['persons'], $type);

        return response()->json([
            'data' => $result,
            'error' => null,
        ]);
    }

    public function export(Request $request)
    {
        $type = $this->resolveType($request);
        $rows = $this->model($type)::query()->orderBy('name', 'asc')->get();

        $columns = [
            'nama', 'nip', 'nipppk', 'nuptk', 'jenis_kelamin', 'agama',
            'tempat_lahir', 'tanggal_lahir', 'status_kepegawaian', 'pangkat_golongan',
            'jabatan', 'nik', 'alamat', 'no_hp', 'npwp', 'email',
        ];

        $filename = ($type === 'guru' ? 'data-guru' : 'data-tendik').'-'.date('Y-m-d').'.csv';

        return response()->streamDownload(function () use ($rows, $columns) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, $columns);

            foreach ($rows as $row) {
                fputcsv($handle, [
                    $row->name,
                    $row->nip ?? '',
                    $row->nipppk ?? '',
                    $row->nuptk ?? '',
                    $row->gender,
                    $row->religion,
                    $row->birth_place,
                    $row->birth_date?->format('Y-m-d') ?? '',
                    $row->status_kepegawaian,
                    $row->pangkat_golongan,
                    $row->jabatan,
                    $row->nik ?? '',
                    $row->address ?? '',
                    $row->phone,
                    $row->npwp,
                    $row->email,
                ]);
            }

            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    // ------------------------------------------------------------------
    // Validation & persistence helpers
    // ------------------------------------------------------------------

    private function validatePerson(Request $request, string $type): array
    {
        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'nip' => ['nullable', 'string', 'max:50'],
            'nipppk' => ['nullable', 'string', 'max:50'],
            'nuptk' => ['nullable', 'string', 'max:50'],
            'gender' => ['nullable', 'string', 'max:20'],
            'religion' => ['nullable', 'string', 'max:50'],
            'birth_place' => ['nullable', 'string', 'max:255'],
            'birth_date' => ['nullable', 'date'],
            'status_kepegawaian' => ['nullable', 'string', 'max:50'],
            'pangkat_golongan' => ['nullable', 'string', 'max:100'],
            'jabatan' => ['nullable', 'string', 'max:255'],
            'tmt_golongan' => ['nullable', 'date'],
            'tmt_cpns' => ['nullable', 'date'],
            'tmt_pns_pppk' => ['nullable', 'date'],
            'tmt_sk_sekolah' => ['nullable', 'date'],
            'nik' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string'],
            'phone' => ['nullable', 'string', 'max:50'],
            'npwp' => ['nullable', 'string', 'max:50'],
            'akta_lahir' => ['nullable', 'string', 'max:100'],
            'bpjs' => ['nullable', 'string', 'max:100'],
            'email' => ['nullable', 'email', 'max:255'],
            'instagram' => ['nullable', 'string', 'max:255'],
            'facebook' => ['nullable', 'string', 'max:255'],
            'twitter' => ['nullable', 'string', 'max:255'],
            'tiktok' => ['nullable', 'string', 'max:255'],
            'youtube' => ['nullable', 'string', 'max:255'],
            'linkedin' => ['nullable', 'string', 'max:255'],
            'website' => ['nullable', 'string', 'max:255'],
            'github' => ['nullable', 'string', 'max:255'],
            'photo' => ['nullable', 'string', 'max:500'],
            'bio' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],

            'educations.*.jenjang' => ['nullable', 'string', 'max:50'],
            'educations.*.jurusan' => ['nullable', 'string', 'max:255'],
            'educations.*.perguruan_tinggi' => ['nullable', 'string', 'max:255'],
            'educations.*.tahun_lulus' => ['nullable', 'integer'],
            'educations.*.tempat' => ['nullable', 'string', 'max:255'],
            'educations.*.nomor_ijazah' => ['nullable', 'string', 'max:255'],
            'educations.*.tanggal_ijazah' => ['nullable', 'date'],

            'assignments.*.jenis' => ['nullable', 'string', Rule::in(['tugas_tambahan', 'tugas_mengajar'])],
            'assignments.*.uraian' => ['nullable', 'string', 'max:255'],
            'assignments.*.jumlah_jam' => ['nullable', 'string', 'max:20'],

            'certifications.*.status' => ['nullable', 'string', 'max:20'],
            'certifications.*.no_sertifikat' => ['nullable', 'string', 'max:100'],
            'certifications.*.no_peserta' => ['nullable', 'string', 'max:100'],
            'certifications.*.no_nrg' => ['nullable', 'string', 'max:100'],
            'certifications.*.bidang_studi' => ['nullable', 'string', 'max:255'],
            'certifications.*.penyelenggara' => ['nullable', 'string', 'max:255'],
            'certifications.*.tahun_lulus' => ['nullable', 'integer'],

            'kgb.no_sk' => ['nullable', 'string', 'max:255'],
            'kgb.tanggal_sk' => ['nullable', 'date'],
            'kgb.gaji_pokok' => ['nullable', 'string', 'max:50'],
            'kgb.mkg' => ['nullable', 'string', 'max:50'],
            'kgb.tmt_kgb_akhir' => ['nullable', 'date'],
            'kgb.tmt_kgb_berikutnya' => ['nullable', 'date'],

            'sk_pengangkatans.*.kategori' => ['nullable', 'string', 'max:30'],
            'sk_pengangkatans.*.nomor_sk' => ['nullable', 'string', 'max:255'],
            'sk_pengangkatans.*.tanggal_sk' => ['nullable', 'date'],
            'sk_pengangkatans.*.pejabat' => ['nullable', 'string', 'max:255'],
        ];

        $data = $request->validate($rules);

        foreach (['nip', 'nipppk', 'nuptk', 'nik'] as $field) {
            if (isset($data[$field])) {
                $data[$field] = preg_replace('/\s/', '', $data[$field]) ?: null;
            }
        }

        $this->assertUnique($type, $data, $request->route('id'));

        $main = array_intersect_key($data, array_flip([
            'name', 'nip', 'nipppk', 'nuptk', 'gender', 'religion', 'birth_place',
            'birth_date', 'status_kepegawaian', 'pangkat_golongan', 'jabatan',
            'tmt_golongan', 'tmt_cpns', 'tmt_pns_pppk', 'tmt_sk_sekolah', 'nik',
            'address', 'phone', 'npwp', 'akta_lahir', 'bpjs', 'email',
            'instagram', 'facebook', 'twitter', 'tiktok', 'youtube', 'linkedin',
            'website', 'github', 'photo',
            'bio', 'is_active',
        ]));

        return [
            'main' => $main,
            'children' => [
                'educations' => $data['educations'] ?? [],
                'assignments' => $data['assignments'] ?? [],
                'certifications' => $data['certifications'] ?? [],
                'kgb' => $data['kgb'] ?? null,
                'sk_pengangkatans' => $data['sk_pengangkatans'] ?? [],
            ],
        ];
    }

    private function assertUnique(string $type, array $data, ?string $ignoreId): void
    {
        foreach (['nip', 'nipppk', 'nuptk'] as $field) {
            $value = $data[$field] ?? null;
            if ($value === null || $value === '') {
                continue;
            }

            $conflict = $this->model($type)::query()
                ->where($field, $value)
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->exists();

            if ($conflict) {
                throw ValidationException::withMessages([
                    $field => strtoupper($field).' sudah dipakai oleh data lain.',
                ]);
            }
        }
    }

    private function syncChildren(string $type, string $staffId, array $children): void
    {
        $this->importer->replaceChildren($type, $staffId, $children);
    }

    private function resolveType(Request $request): string
    {
        $type = (string) ($request->route('type') ?? $request->query('type') ?? 'guru');

        if (! in_array($type, self::TYPES, true)) {
            throw ValidationException::withMessages(['type' => 'Tipe data harus guru atau tendik.']);
        }

        return $type;
    }

    private function model(string $type): string
    {
        return $type === 'guru' ? SdmGuru::class : SdmTendik::class;
    }

    private function brief($record): array
    {
        return [
            'id' => $record->id,
            'name' => $record->name,
            'nip' => $record->nip,
            'nipppk' => $record->nipppk,
            'nuptk' => $record->nuptk,
            'gender' => $record->gender,
            'jabatan' => $record->jabatan,
            'status_kepegawaian' => $record->status_kepegawaian,
            'pangkat_golongan' => $record->pangkat_golongan,
            'photo' => $record->photo,
            'phone' => $record->phone,
            'email' => $record->email,
            'is_active' => $record->is_active,
            'linked_account' => (bool) $record->user,
            'created_at' => $record->created_at?->toIso8601String(),
        ];
    }

    private function detail($record): array
    {
        return array_merge($this->brief($record), [
            'religion' => $record->religion,
            'birth_place' => $record->birth_place,
            'birth_date' => $record->birth_date?->format('Y-m-d'),
            'tmt_golongan' => $record->tmt_golongan?->format('Y-m-d'),
            'tmt_cpns' => $record->tmt_cpns?->format('Y-m-d'),
            'tmt_pns_pppk' => $record->tmt_pns_pppk?->format('Y-m-d'),
            'tmt_sk_sekolah' => $record->tmt_sk_sekolah?->format('Y-m-d'),
            'nik' => $record->nik,
            'address' => $record->address,
            'npwp' => $record->npwp,
            'akta_lahir' => $record->akta_lahir,
            'bpjs' => $record->bpjs,
            'email' => $record->email,
            'instagram' => $record->instagram,
            'facebook' => $record->facebook,
            'twitter' => $record->twitter,
            'tiktok' => $record->tiktok,
            'youtube' => $record->youtube,
            'linkedin' => $record->linkedin,
            'website' => $record->website,
            'github' => $record->github,
            'bio' => $record->bio,
            'educations' => $record->educations->map(fn ($e) => [
                'id' => $e->id,
                'jenjang' => $e->jenjang,
                'jurusan' => $e->jurusan,
                'perguruan_tinggi' => $e->perguruan_tinggi,
                'tahun_lulus' => $e->tahun_lulus,
                'tempat' => $e->tempat,
                'nomor_ijazah' => $e->nomor_ijazah,
                'tanggal_ijazah' => $e->tanggal_ijazah?->format('Y-m-d'),
            ]),
            'assignments' => $record->assignments->map(fn ($a) => [
                'id' => $a->id,
                'jenis' => $a->jenis,
                'uraian' => $a->uraian,
                'jumlah_jam' => $a->jumlah_jam,
            ]),
            'certifications' => $record->certifications->map(fn ($c) => [
                'id' => $c->id,
                'status' => $c->status,
                'no_sertifikat' => $c->no_sertifikat,
                'no_peserta' => $c->no_peserta,
                'no_nrg' => $c->no_nrg,
                'bidang_studi' => $c->bidang_studi,
                'penyelenggara' => $c->penyelenggara,
                'tahun_lulus' => $c->tahun_lulus,
            ]),
            'kgb' => $record->kgb ? [
                'id' => $record->kgb->id,
                'no_sk' => $record->kgb->no_sk,
                'tanggal_sk' => $record->kgb->tanggal_sk?->format('Y-m-d'),
                'gaji_pokok' => $record->kgb->gaji_pokok,
                'mkg' => $record->kgb->mkg,
                'tmt_kgb_akhir' => $record->kgb->tmt_kgb_akhir?->format('Y-m-d'),
                'tmt_kgb_berikutnya' => $record->kgb->tmt_kgb_berikutnya?->format('Y-m-d'),
            ] : null,
            'sk_pengangkatans' => $record->skPengangkatans->map(fn ($sk) => [
                'id' => $sk->id,
                'kategori' => $sk->kategori,
                'nomor_sk' => $sk->nomor_sk,
                'tanggal_sk' => $sk->tanggal_sk?->format('Y-m-d'),
                'pejabat' => $sk->pejabat,
            ]),
        ]);
    }

    private function deleteStoredFile(?string $url): void
    {
        if (! $url) {
            return;
        }

        $path = parse_url($url, PHP_URL_PATH) ?? '';
        $prefix = '/storage/';
        if (str_starts_with($path, $prefix)) {
            $path = substr($path, strlen($prefix));
        }

        if ($path !== '') {
            try {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($path);
            } catch (\Throwable) {
                // Gagal menghapus file tidak menggagalkan operasi database.
            }
        }
    }
}