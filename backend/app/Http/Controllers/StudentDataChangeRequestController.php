<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\StudentDataChangeRequest;
use App\Services\PermissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StudentDataChangeRequestController extends Controller
{
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

        // Fields that students are allowed to request changes for
        $allowedFields = [
            'nickname', 'phone', 'address', 'tinggal_dengan', 'jarak_sekolah',
            'golongan_darah', 'penyakit', 'kelainan_jasmani', 'tinggi_cm', 'berat_kg',
            'ayah_nama', 'ayah_tempat', 'ayah_tanggal_lahir', 'ayah_agama', 'ayah_kewarganegaraan',
            'ayah_pendidikan', 'ayah_pekerjaan', 'ayah_penghasilan', 'ayah_alamat', 'ayah_no_telp',
            'ibu_nama', 'ibu_tempat', 'ibu_tanggal_lahir', 'ibu_agama', 'ibu_kewarganegaraan',
            'ibu_pendidikan', 'ibu_pekerjaan', 'ibu_penghasilan', 'ibu_alamat', 'ibu_no_telp',
            'wali_nama', 'wali_tempat', 'wali_tanggal_lahir', 'wali_agama', 'wali_kewarganegaraan',
            'wali_pendidikan', 'wali_pekerjaan', 'wali_penghasilan', 'wali_alamat', 'wali_no_telp',
            'gemar_kesenian', 'gemar_olahraga', 'gemar_kemasyarakatan', 'gemar_lain',
            'kewarganegaraan', 'bahasa_sehari_hari',
        ];

        $filtered = [];
        foreach ($proposedData as $key => $value) {
            if (in_array($key, $allowedFields, true)) {
                $filtered[$key] = $value;
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
            $oldData[$key] = $student->{$key};
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
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('nisn', 'ilike', "%{$search}%");
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
                    $student->update($changeRequest->proposed_data);
                }
            }
        });

        return response()->json(['data' => $changeRequest->fresh()->load(['student:id,name,nisn', 'verifier:id,name']), 'error' => null]);
    }
}
