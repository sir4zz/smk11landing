<?php

namespace App\Http\Controllers;

use App\Models\Guru;
use App\Models\GuruDataChangeRequest;
use App\Models\SdmGuru;
use App\Models\User;
use App\Services\AccountService;
use App\Services\PermissionService;
use App\Services\SdmAccountService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Guru data change requests: the guru reads their own official data, proposes
 * changes to fields they may not edit directly, and an operator verifies them
 * (sdm.view to read, sdm.edit to verify — enforced in routes).
 */
class GuruDataChangeRequestController extends Controller
{
    private const ALLOWED_FIELDS = [
        'name', 'nip', 'nipppk', 'nuptk', 'nik', 'npwp', 'akta_lahir', 'bpjs',
        'gender', 'religion', 'birth_place', 'birth_date',
        'status_kepegawaian', 'pangkat_golongan', 'jabatan',
        'tmt_golongan', 'tmt_cpns', 'tmt_pns_pppk', 'tmt_sk_sekolah',
    ];

    private const DATE_FIELDS = ['birth_date', 'tmt_golongan', 'tmt_cpns', 'tmt_pns_pppk', 'tmt_sk_sekolah'];

    public function __construct(
        protected PermissionService $permissions,
        protected SdmAccountService $sdmAccounts,
        protected AccountService $accounts
    ) {
    }

    // ── GURU: get own official SDM data ───────────────────────────────────

    public function myData(Request $request): JsonResponse
    {
        $guru = $this->resolveGuru($request);

        if (! $guru) {
            return $this->forbidden();
        }

        return response()->json([
            'data' => $this->accounts->sdmGuruPayload($guru),
            'error' => null,
        ]);
    }

    // ── GURU: list own change requests ────────────────────────────────────

    public function myRequests(Request $request): JsonResponse
    {
        $guru = $this->resolveGuru($request);

        if (! $guru) {
            return $this->forbidden();
        }

        $requests = GuruDataChangeRequest::query()
            ->where('guru_id', $guru->id)
            ->with('verifier:id,name')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['data' => $requests, 'error' => null]);
    }

    // ── GURU: submit change request ───────────────────────────────────────

    public function store(Request $request): JsonResponse
    {
        $guru = $this->resolveGuru($request);

        if (! $guru) {
            return $this->forbidden();
        }

        $proposedData = $request->input('proposed_data', []);

        if (empty($proposedData)) {
            return response()->json(['error' => ['message' => 'Data perubahan tidak boleh kosong.']], 422);
        }

        $filtered = [];
        foreach ($proposedData as $key => $value) {
            if (in_array($key, self::ALLOWED_FIELDS, true)) {
                $filtered[$key] = $value;
            }
        }

        if (empty($filtered)) {
            return response()->json(['error' => ['message' => 'Tidak ada kolom yang valid untuk diubah.']], 422);
        }

        $pending = GuruDataChangeRequest::query()
            ->where('guru_id', $guru->id)
            ->where('status', 'menunggu')
            ->exists();

        if ($pending) {
            return response()->json(['error' => ['message' => 'Anda sudah memiliki pengajuan yang sedang menunggu verifikasi. Silakan tunggu atau batalkan pengajuan sebelumnya.']], 422);
        }

        $oldData = [];
        foreach (array_keys($filtered) as $key) {
            $oldData[$key] = $this->rawValue($guru, $key);
        }

        $changeRequest = DB::transaction(fn () => GuruDataChangeRequest::create([
            'guru_id' => $guru->id,
            'old_data' => $oldData,
            'proposed_data' => $filtered,
            'status' => 'menunggu',
        ]));

        return response()->json(['data' => $changeRequest, 'error' => null], 201);
    }

    // ── GURU: cancel pending request ──────────────────────────────────────

    public function cancel(Request $request, string $id): JsonResponse
    {
        $guru = $this->resolveGuru($request);

        if (! $guru) {
            return $this->forbidden();
        }

        $changeRequest = GuruDataChangeRequest::query()
            ->where('id', $id)
            ->where('guru_id', $guru->id)
            ->where('status', 'menunggu')
            ->first();

        if (! $changeRequest) {
            return response()->json(['error' => ['message' => 'Pengajuan tidak ditemukan atau sudah diproses.']], 404);
        }

        $changeRequest->update(['status' => 'dibatalkan']);

        return response()->json(['data' => $changeRequest, 'error' => null]);
    }

    // ── OPERATOR: list all change requests ────────────────────────────────

    public function adminIndex(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user || ! $this->permissions->isStaff($user)) {
            return $this->forbidden();
        }

        $query = GuruDataChangeRequest::query()
            ->with(['guru:id,name,nip,nuptk,jabatan', 'verifier:id,name']);

        $status = $request->input('status');
        if ($status && in_array($status, ['menunggu', 'disetujui', 'ditolak'], true)) {
            $query->where('status', $status);
        }

        $search = $request->input('search');
        if ($search) {
            $query->whereHas('guru', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('nip', 'like', "%{$search}%")
                    ->orWhere('nuptk', 'like', "%{$search}%");
            });
        }

        $requests = $query->orderBy('created_at', 'desc')->get();

        return response()->json(['data' => $requests, 'error' => null]);
    }

    // ── OPERATOR: get single change request detail ────────────────────────

    public function adminShow(Request $request, string $id): JsonResponse
    {
        $user = $request->user();

        if (! $user || ! $this->permissions->isStaff($user)) {
            return $this->forbidden();
        }

        $changeRequest = GuruDataChangeRequest::query()
            ->with(['guru:id,name,nip,nuptk,jabatan', 'verifier:id,name'])
            ->find($id);

        if (! $changeRequest) {
            return response()->json(['error' => ['message' => 'Pengajuan tidak ditemukan.']], 404);
        }

        return response()->json(['data' => $changeRequest, 'error' => null]);
    }

    // ── OPERATOR: approve / reject ────────────────────────────────────────

    public function verify(Request $request, string $id): JsonResponse
    {
        $user = $request->user();

        if (! $user || ! $this->permissions->isStaff($user)) {
            return $this->forbidden();
        }

        $changeRequest = GuruDataChangeRequest::find($id);

        if (! $changeRequest) {
            return response()->json(['error' => ['message' => 'Pengajuan tidak ditemukan.']], 404);
        }

        if ($changeRequest->status !== 'menunggu') {
            return response()->json(['error' => ['message' => 'Pengajuan ini sudah diproses sebelumnya.']], 422);
        }

        $status = $request->input('status');

        if (! in_array($status, ['disetujui', 'ditolak'], true)) {
            return response()->json(['error' => ['message' => 'Status verifikasi tidak valid.']], 422);
        }

        try {
            DB::transaction(function () use ($changeRequest, $status, $request, $user) {
                $updatePayload = [
                    'status' => $status,
                    'verified_by' => $user->id,
                    'verified_at' => now(),
                ];

                if ($status === 'ditolak') {
                    $updatePayload['rejection_reason'] = $request->input('rejection_reason', '');
                }

                $changeRequest->update($updatePayload);

                if ($status === 'disetujui') {
                    $guru = SdmGuru::find($changeRequest->guru_id);
                    if ($guru) {
                        $this->applyChanges($guru, $changeRequest->proposed_data);
                    }
                }
            });
        } catch (HttpException $e) {
            throw $e;
        } catch (\Throwable $e) {
            report($e);
            return response()->json(['error' => ['message' => 'Gagal memproses pengajuan. Silakan coba lagi.']], 422);
        }

        return response()->json([
            'data' => $changeRequest->fresh()->load(['guru:id,name,nip,nuptk,jabatan', 'verifier:id,name']),
            'error' => null,
        ]);
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private function resolveGuru(Request $request): ?SdmGuru
    {
        $user = $request->user();

        if (! $user || ! $this->permissions->isGuru($user)) {
            return null;
        }

        return $this->sdmAccounts->resolveGuruForUser($user);
    }

    private function applyChanges(SdmGuru $guru, array $proposed): void
    {
        $updates = [];
        foreach (self::ALLOWED_FIELDS as $key) {
            if (! array_key_exists($key, $proposed)) {
                continue;
            }
            $value = $proposed[$key];
            $updates[$key] = in_array($key, self::DATE_FIELDS, true)
                ? $this->accounts->normalizeDate($value)
                : (is_string($value) ? trim($value) : $value);
        }

        $this->assertIdentifierFree($guru, 'nip', $updates['nip'] ?? null);
        $this->assertIdentifierFree($guru, 'nipppk', $updates['nipppk'] ?? null);
        $this->assertIdentifierFree($guru, 'nuptk', $updates['nuptk'] ?? null);

        $guru->update($updates);

        // Keep login identifiers (NIP/NIPPPK/NUPTK) in sync so login keeps working.
        if ($guru->user_id) {
            $legacy = Guru::find($guru->user_id);
            if ($legacy) {
                $legacy->update([
                    'nip' => $guru->nip ?: null,
                    'nipppk' => $guru->nipppk ?: null,
                    'nuptk' => $guru->nuptk ?: null,
                ]);
            }

            if (isset($updates['name'])) {
                $user = User::find($guru->user_id);
                if ($user) {
                    $user->update(['name' => $updates['name']]);
                    $user->profileRecord?->update(['name' => $updates['name']]);
                }
            }
        }
    }

    private function assertIdentifierFree(SdmGuru $guru, string $field, mixed $value): void
    {
        if ($value === null || $value === '') {
            return;
        }

        $conflict = SdmGuru::query()
            ->where($field, $value)
            ->where('id', '!=', $guru->id)
            ->exists();

        if ($conflict) {
            throw $this->httpFail(strtoupper($field).' sudah dipakai oleh data lain.');
        }

        $legacyConflict = Guru::query()
            ->where($field, $value)
            ->when($guru->user_id, fn ($q) => $q->where('id', '!=', $guru->user_id))
            ->exists();

        if ($legacyConflict) {
            throw $this->httpFail(strtoupper($field).' sudah dipakai oleh akun guru lain.');
        }
    }

    private function rawValue(SdmGuru $guru, string $key): mixed
    {
        $value = $guru->{$key};

        if (in_array($key, self::DATE_FIELDS, true) && $value instanceof \DateTimeInterface) {
            return $value->format('Y-m-d');
        }

        return $value;
    }

    private function forbidden(): JsonResponse
    {
        return response()->json(['error' => ['message' => 'Forbidden.']], 403);
    }

    private function httpFail(string $message): HttpException
    {
        return new HttpException(422, $message);
    }
}