<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\StudentDataChangeRequest;
use App\Models\User;
use App\Services\PermissionService;
use App\Services\WhatsAppService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class StudentDataChangeRequestController extends Controller
{
    /**
     * Kolom berkas siswa yang bisa diubah lewat pengajuan dan harus dibersihkan
     * dari disk bila tidak jadi dipakai (ditolak/dibatalkan/diganti).
     */
    private const FILE_KEYS = ['foto', 'doc_kk', 'doc_akta', 'doc_ijazah', 'doc_lainnya'];

    public function __construct(protected PermissionService $permissions)
    {
    }

    // ── STUDENT: get own biodata ──────────────────────────────────────────

    public function myData(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user || ! $this->permissions->isStudent($user)) {
            return response()->json(['error' => ['message' => 'Forbidden.']], 403);
        }

        $student = $user->student;

        if (! $student) {
            return response()->json(['error' => ['message' => 'Data siswa tidak ditemukan.']], 404);
        }

        return response()->json(['data' => $student, 'error' => null]);
    }

    // ── STUDENT: list own change requests ─────────────────────────────────

    public function myRequests(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user || ! $this->permissions->isStudent($user)) {
            return response()->json(['error' => ['message' => 'Forbidden.']], 403);
        }

        $student = $user->student;

        if (! $student) {
            return response()->json(['error' => ['message' => 'Data siswa tidak ditemukan.']], 404);
        }

        $requests = StudentDataChangeRequest::where('student_id', $student->id)
            ->with('verifier:id,name')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['data' => $requests, 'error' => null]);
    }

    // ── STUDENT: submit change request ────────────────────────────────────

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user || ! $this->permissions->isStudent($user)) {
            return response()->json(['error' => ['message' => 'Forbidden.']], 403);
        }

        $student = $user->student;

        if (! $student) {
            return response()->json(['error' => ['message' => 'Data siswa tidak ditemukan.']], 404);
        }

        $proposedData = $request->input('proposed_data', []);

        if (empty($proposedData)) {
            return response()->json(['error' => ['message' => 'Data perubahan tidak boleh kosong.']], 422);
        }

        // PIN baru hanya boleh masuk pengajuan jika PIN saat ini terverifikasi.
        if (array_key_exists('pin', $proposedData)) {
            $currentPin = (string) ($proposedData['current_pin'] ?? '');
            if (! Hash::check($currentPin, $user->password)) {
                return response()->json(['error' => ['message' => 'PIN saat ini salah.']], 422);
            }
            $newPin = (string) ($proposedData['pin'] ?? '');
            if (! preg_match('/^\d{4}$/', $newPin)) {
                return response()->json(['error' => ['message' => 'PIN baru harus 4 digit angka.']], 422);
            }
        }

        // Fields that students are allowed to request changes for. Full Admin
        // biodata set, kecuali identifier login (nisn/nis) yang tetap Admin-only.
        $allowedFields = $this->editableFields();

        $filtered = [];
        foreach ($proposedData as $key => $value) {
            if (in_array($key, $allowedFields, true)) {
                $filtered[$key] = $this->normalizeValue($key, $value);
            }
        }

        if (empty($filtered)) {
            return response()->json(['error' => ['message' => 'Tidak ada kolom yang valid untuk diubah.']], 422);
        }

        // Check if there's already a pending request
        $pending = StudentDataChangeRequest::where('student_id', $student->id)
            ->where('status', 'menunggu')
            ->exists();

        if ($pending) {
            return response()->json(['error' => ['message' => 'Anda sudah memiliki pengajuan yang sedang menunggu verifikasi. Silakan tunggu atau batalkan pengajuan sebelumnya.']], 422);
        }

        // Build old_data snapshot
        $oldData = [];
        foreach (array_keys($filtered) as $key) {
            // Jangan mencatat PIN lama apa pun ke snapshot pengajuan.
            $oldData[$key] = $key === 'pin' ? '' : $this->normalizeValue($key, $student->{$key});
        }

        $changeRequest = DB::transaction(function () use ($student, $oldData, $filtered) {
            return StudentDataChangeRequest::create([
                'student_id' => $student->id,
                'old_data' => $oldData,
                'proposed_data' => $filtered,
                'status' => 'menunggu',
            ]);
        });

        return response()->json(['data' => $changeRequest, 'error' => null], 201);
    }

    // ── STUDENT: cancel pending request ───────────────────────────────────

    public function cancel(Request $request, string $id): JsonResponse
    {
        $user = $request->user();

        if (! $user || ! $this->permissions->isStudent($user)) {
            return response()->json(['error' => ['message' => 'Forbidden.']], 403);
        }

        $student = $user->student;

        if (! $student) {
            return response()->json(['error' => ['message' => 'Data siswa tidak ditemukan.']], 404);
        }

        $changeRequest = StudentDataChangeRequest::where('id', $id)
            ->where('student_id', $student->id)
            ->where('status', 'menunggu')
            ->first();

        if (! $changeRequest) {
            return response()->json(['error' => ['message' => 'Pengajuan tidak ditemukan atau sudah diproses.']], 404);
        }

        $changeRequest->update(['status' => 'dibatalkan']);

        $this->cleanupPendingFiles($changeRequest);

        return response()->json(['data' => $changeRequest, 'error' => null]);
    }

    // ── OPERATOR: list all change requests ────────────────────────────────

    public function adminIndex(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user || ! $this->permissions->isStaff($user)) {
            return response()->json(['error' => ['message' => 'Forbidden.']], 403);
        }

        $query = StudentDataChangeRequest::with(['student:id,name,nisn,class,major', 'verifier:id,name']);

        $status = $request->input('status');
        if ($status && in_array($status, ['menunggu', 'disetujui', 'ditolak'], true)) {
            $query->where('status', $status);
        }

        $search = $request->input('search');
        if ($search) {
            $query->whereHas('student', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('nisn', 'like', "%{$search}%");
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
            return response()->json(['error' => ['message' => 'Forbidden.']], 403);
        }

        $changeRequest = StudentDataChangeRequest::with(['student', 'verifier:id,name'])
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
            return response()->json(['error' => ['message' => 'Forbidden.']], 403);
        }

        $changeRequest = StudentDataChangeRequest::find($id);

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

            // If approved, apply changes to the student record
            if ($status === 'disetujui') {
                $student = Student::find($changeRequest->student_id);
                if ($student) {
                    $proposed = $changeRequest->proposed_data;

                    // Snapshot replaced uploaded files BEFORE the update: after
                    // save() getOriginal() reflects the newly saved value.
                    $previousFiles = [];
                    foreach (self::FILE_KEYS as $fileKey) {
                        $previousFiles[$fileKey] = $student->getRawOriginal($fileKey);
                    }

                    $student->update($proposed);

                    // Keep login/display name mirrors in sync when the name changed.
                    $accountUser = User::find($student->id);
                    if ($accountUser) {
                        if (isset($proposed['name']) && $proposed['name'] !== '') {
                            $accountUser->update(['name' => $proposed['name']]);
                            $accountUser->profileRecord?->update(['name' => $proposed['name']]);
                        }
                        // PIN baru juga harus disinkronkan ke hash login (users.password).
                        if (isset($proposed['pin']) && $proposed['pin'] !== '') {
                            $accountUser->update(['password' => Hash::make($proposed['pin'])]);
                        }
                    }

                    foreach ($previousFiles as $fileKey => $previous) {
                        if ($student->wasChanged($fileKey) && $previous) {
                            $this->deleteUploadedFile($previous);
                        }
                    }
                }
                return;
            }

            // Rejected: the submitted file (if any) is never promoted to the
            // main profile, so remove it to avoid orphaned files.
            $this->cleanupPendingFiles($changeRequest);
        });

        $fresh = $changeRequest->fresh();
        $fresh->load(['student:id,name,nisn,class,major,phone', 'verifier:id,name']);

        // Kirim notifikasi WhatsApp ke siswa (gagal kirim tidak menggagalkan verifikasi).
        // Nomor tujuan: nomor baru hasil pengajuan bila ada, jika tidak pakai nomor lama.
        app(WhatsAppService::class)->sendStudentDataChangeVerification($fresh);

        return response()->json(['data' => $fresh, 'error' => null]);
    }

    /**
     * Colom biodata Admin yang boleh diajukan siswa (identifier nisn/nis
     * tetap Admin-only karena dipakai sebagai login account).
     *
     * @return string[]
     */
    private function editableFields(): array
    {
        $fields = [
            // A. Keterangan Peserta Didik (name, place_of_birth, date_of_birth, anak_ke dikecualikan)
            'nickname', 'class', 'major', 'gender',
            'religion', 'kewarganegaraan',
            'jml_saudara_kandung', 'jml_saudara_tiri', 'anak_yatim_piatu',
            'bahasa_sehari_hari',
            // B. Keterangan Tempat Tinggal (address dikecualikan)
            'phone', 'tinggal_dengan', 'jarak_sekolah',
            'desa', 'kode_pos', 'jenis_tempat_tinggal', 'jarak_tempuh', 'transportasi',
            'asal_sekolah', 'nik', 'email', 'no_kk', 'kepala_keluarga', 'no_kip',
            'cita_cita', 'hobi', 'pernah_paud', 'pernah_tk', 'status_afirmasi',
            // C. Keterangan Kesehatan
            'golongan_darah', 'penyakit', 'kelainan_jasmani', 'tinggi_cm', 'berat_kg',
            // D. Keterangan Pendidikan — seluruhnya dikecualikan
            // H. Kegemaran Siswa
            'gemar_kesenian', 'gemar_olahraga', 'gemar_kemasyarakatan', 'gemar_lain',
            // I. Keterangan Siswa
            'siswa_status', 'siswa_tanggal',
            'beasiswa_status', 'beasiswa_tk', 'beasiswa_dari',
            // Dokumen siswa (opsional, bucket student/documents sama seperti Admin)
            'doc_kk', 'doc_akta', 'doc_ijazah', 'doc_lainnya',
            'foto',
            // PIN login (tetap diverifikasi PIN saat ini saat pengajuan)
            'pin',
        ];

        foreach (['ayah', 'ibu', 'wali'] as $p) {
            foreach (['tempat', 'tanggal_lahir', 'agama', 'kewarganegaraan', 'pendidikan', 'pekerjaan', 'penghasilan', 'alamat', 'no_telp', 'status_hidup'] as $c) {
                $fields[] = "{$p}_{$c}";
            }
        }

        return $fields;
    }

    /**
     * Normalkan nilai sebelum disimpan ke snapshot old/proposed.
     */
    private function normalizeValue(string $key, mixed $value): mixed
    {
        if ($value instanceof \DateTimeInterface) {
            return $value->toDateString();
        }

        if ($value === null || $value === '' || is_bool($value)) {
            return $value;
        }

        return (string) $value;
    }

    /**
     * Hapus berkas (foto/dokumen) yang diajukan namun tidak pernah menjadi
     * data utama ketika pengajuan dibatalkan/ditolak (hindari file sampah).
     */
    private function cleanupPendingFiles(StudentDataChangeRequest $changeRequest): void
    {
        foreach (self::FILE_KEYS as $fileKey) {
            $old = $changeRequest->old_data[$fileKey] ?? null;
            $new = $changeRequest->proposed_data[$fileKey] ?? null;

            if ($new !== null && $new !== '' && (string) $new !== (string) $old) {
                $this->deleteUploadedFile((string) $new);
            }
        }
    }

    private function deleteUploadedFile(?string $url): void
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
            Storage::disk('public')->delete($path);
        }
    }
}
