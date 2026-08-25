<?php

namespace App\Http\Controllers;

use App\Models\AlumniGraduation;
use App\Services\WhatsAppService;
use Illuminate\Http\Request;

class AlumniGraduationController extends Controller
{
    // ------------------------------------------------------------------
    // PUBLIC (alumni form submission)
    // ------------------------------------------------------------------

    public function store(Request $request)
    {
        $payload = $this->validatedPayload($request);

        if (empty($payload['name']) || empty($payload['nisn'])) {
            return response()->json(['data' => null, 'error' => ['message' => 'Nama dan NISN wajib diisi.']], 422);
        }

        $payload['verification_status'] = 'menunggu';
        $payload['verification_note'] = '';

        $record = AlumniGraduation::create($payload);

        return response()->json(['data' => $record->fresh(), 'error' => null], 201);
    }

    // ------------------------------------------------------------------
    // ADMIN
    // ------------------------------------------------------------------

    public function adminIndex(Request $request)
    {
        $query = AlumniGraduation::query();

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('nisn', 'like', "%{$search}%");
            });
        }

        if ($request->filled('graduation_year')) {
            $query->where('graduation_year', (int) $request->query('graduation_year'));
        }

        if ($request->filled('major')) {
            $query->where('major', $request->query('major'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('verification_status')) {
            $query->where('verification_status', $request->query('verification_status'));
        }

        $query->orderByDesc('graduation_year')->orderBy('name');

        $count = $request->query('count') === 'exact' ? $query->count() : null;

        if ($request->filled('limit')) {
            $query->limit((int) $request->query('limit'));
        }

        if ($request->filled('page') && $request->filled('limit')) {
            $page = (int) $request->query('page');
            $limit = (int) $request->query('limit');
            $query->offset(($page - 1) * $limit);
        }

        $rows = $query->get();

        return response()->json(['data' => $rows, 'error' => null, 'count' => $count]);
    }

    public function show(string $id)
    {
        $record = AlumniGraduation::findOrFail($id);
        return response()->json(['data' => $record, 'error' => null]);
    }

    public function update(Request $request, string $id)
    {
        $record = AlumniGraduation::findOrFail($id);
        $payload = $this->validatedPayload($request);

        if (!empty($payload)) {
            $record->update($payload);
        }

        // Kirim notifikasi WhatsApp bila status verifikasi berubah lewat update.
        if ($record->wasChanged('verification_status') && $record->verification_status !== 'menunggu') {
            app(WhatsAppService::class)->sendGraduationVerification($record->fresh());
        }

        return response()->json(['data' => $record->fresh(), 'error' => null]);
    }

    public function destroy(string $id)
    {
        $record = AlumniGraduation::findOrFail($id);
        $record->delete();

        return response()->json(['data' => null, 'error' => null]);
    }

    public function verify(Request $request, string $id)
    {
        $record = AlumniGraduation::findOrFail($id);

        $status = $request->input('verification_status', 'terverifikasi');
        $note = $request->input('verification_note', '');

        if (!in_array($status, ['menunggu', 'terverifikasi', 'ditolak'], true)) {
            return response()->json(['data' => null, 'error' => ['message' => 'Status verifikasi tidak valid.']], 422);
        }

        $record->update([
            'verification_status' => $status,
            'verification_note' => $note,
        ]);

        // Kirim notifikasi WhatsApp ke siswa/alumni (gagal kirim tidak menggagalkan verifikasi).
        if ($record->wasChanged('verification_status') && $status !== 'menunggu') {
            app(WhatsAppService::class)->sendGraduationVerification($record->fresh());
        }

        return response()->json(['data' => $record->fresh(), 'error' => null]);
    }

    public function stats(Request $request)
    {
        $query = AlumniGraduation::query();

        if ($request->filled('graduation_year')) {
            $query->where('graduation_year', (int) $request->query('graduation_year'));
        }

        if ($request->filled('major')) {
            $query->where('major', $request->query('major'));
        }

        $all = $query->get();
        $total = $all->count();
        $filled = $all->where('status', '!=', '')->count();
        $bekerja = $all->where('status', 'bekerja')->count();
        $kuliah = $all->where('status', 'kuliah')->count();
        $wirausaha = $all->where('status', 'wirausaha')->count();
        $belum_bekerja = $all->where('status', 'belum_bekerja')->count();
        $keterserapan = $total > 0 ? round(($bekerja + $kuliah + $wirausaha) / $total * 100, 1) : 0;

        // Average wait time (in months) for employed alumni
        $employed = $all->where('status', 'bekerja');
        $waitTimes = $employed->map(function ($record) {
            $detail = $record->status_detail ?? [];
            return isset($detail['wait_time_months']) ? (int) $detail['wait_time_months'] : null;
        })->filter()->values();
        $avgWaitTime = $waitTimes->count() > 0 ? round($waitTimes->avg(), 1) : 0;

        // Job-major match percentage
        $matchCount = $employed->filter(function ($record) {
            $detail = $record->status_detail ?? [];
            return !empty($detail['job_matches_major']);
        })->count();
        $matchPercentage = $bekerja > 0 ? round($matchCount / $bekerja * 100, 1) : 0;

        // By major
        $byMajor = $all->groupBy('major')->map(function ($items, $major) {
            return [
                'major' => $major,
                'total' => $items->count(),
                'bekerja' => $items->where('status', 'bekerja')->count(),
                'kuliah' => $items->where('status', 'kuliah')->count(),
                'wirausaha' => $items->where('status', 'wirausaha')->count(),
                'belum_bekerja' => $items->where('status', 'belum_bekerja')->count(),
            ];
        })->values();

        // By year
        $byYear = $all->groupBy('graduation_year')->map(function ($items, $year) {
            $total = $items->count();
            $bekerja = $items->where('status', 'bekerja')->count();
            $kuliah = $items->where('status', 'kuliah')->count();
            $wirausaha = $items->where('status', 'wirausaha')->count();
            $belum = $items->where('status', 'belum_bekerja')->count();
            return [
                'year' => (int) $year,
                'total' => $total,
                'bekerja' => $bekerja,
                'kuliah' => $kuliah,
                'wirausaha' => $wirausaha,
                'belum_bekerja' => $belum,
                'keterserapan' => $total > 0 ? round(($bekerja + $kuliah + $wirausaha) / $total * 100, 1) : 0,
            ];
        })->values()->sortByDesc('year')->values();

        return response()->json([
            'data' => [
                'total' => $total,
                'filled' => $filled,
                'bekerja' => $bekerja,
                'kuliah' => $kuliah,
                'wirausaha' => $wirausaha,
                'belum_bekerja' => $belum_bekerja,
                'keterserapan' => $keterserapan,
                'avg_wait_time' => $avgWaitTime,
                'job_match_percentage' => $matchPercentage,
                'by_major' => $byMajor,
                'by_year' => $byYear,
            ],
            'error' => null,
        ]);
    }

    // ------------------------------------------------------------------
    // EXPORT
    // ------------------------------------------------------------------

    public function export(Request $request)
    {
        $query = AlumniGraduation::query();

        if ($request->filled('graduation_year')) {
            $query->where('graduation_year', (int) $request->query('graduation_year'));
        }
        if ($request->filled('major')) {
            $query->where('major', $request->query('major'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        $rows = $query->orderByDesc('graduation_year')->orderBy('name')->get();

        $header = ['Nama', 'NISN', 'Jurusan', 'Tahun Lulus', 'No. HP', 'Email', 'Domisili', 'Status', 'Status Verifikasi'];
        $lines = [$header];
        foreach ($rows as $row) {
            $statusLabels = ['bekerja' => 'Bekerja', 'kuliah' => 'Kuliah', 'wirausaha' => 'Wirausaha', 'belum_bekerja' => 'Belum Bekerja'];
            $verifyLabels = ['menunggu' => 'Menunggu Verifikasi', 'terverifikasi' => 'Terverifikasi', 'ditolak' => 'Ditolak'];
            $lines[] = [
                $row->name,
                $row->nisn,
                $row->major,
                $row->graduation_year,
                $row->phone,
                $row->email,
                $row->domicile,
                $statusLabels[$row->status] ?? $row->status,
                $verifyLabels[$row->verification_status] ?? $row->verification_status,
            ];
        }

        $csv = '';
        foreach ($lines as $line) {
            $csv .= '"' . implode('","', $line) . '"' . "\n";
        }

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="kelulusan-siswa-export.csv"',
        ]);
    }

    // ------------------------------------------------------------------
    // HELPERS
    // ------------------------------------------------------------------

    protected function validatedPayload(Request $request): array
    {
        $data = $request->all();

        $rules = [
            'name' => 'nullable|string',
            'nisn' => 'nullable|string',
            'major' => 'nullable|string',
            'graduation_year' => 'nullable|integer',
            'phone' => 'nullable|string',
            'email' => 'nullable|string',
            'domicile' => 'nullable|string',
            'status' => 'nullable|string',
            'status_detail' => 'nullable',
            'verification_status' => 'nullable|string',
            'verification_note' => 'nullable|string',
            'submitted_by' => 'nullable|string',
        ];

        $validated = $request->validate($rules);

        $payload = [];
        foreach (array_keys($rules) as $field) {
            if (array_key_exists($field, $data)) {
                $payload[$field] = $validated[$field] ?? null;
            }
        }

        if (array_key_exists('graduation_year', $payload)) {
            $payload['graduation_year'] = (int) ($payload['graduation_year'] ?? 0);
        }

        return $payload;
    }
}
