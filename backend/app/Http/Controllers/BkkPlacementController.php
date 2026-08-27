<?php

namespace App\Http\Controllers;

use App\Models\BkkPlacement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BkkPlacementController extends Controller
{
    // ------------------------------------------------------------------
    // ADMIN
    // ------------------------------------------------------------------

    public function adminIndex(Request $request)
    {
        $query = BkkPlacement::query();

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('alumni_name', 'like', "%{$search}%")
                    ->orWhere('nik', 'like', "%{$search}%")
                    ->orWhere('company_name', 'like', "%{$search}%")
                    ->orWhere('position', 'like', "%{$search}%")
                    ->orWhere('major', 'like', "%{$search}%");
            });
        }

        if ($request->filled('year')) {
            $query->where('year', (int) $request->query('year'));
        }

        if ($request->filled('month')) {
            $query->where('month', 'like', $request->query('month'));
        }

        $query->orderByDesc('year')->orderByDesc('created_at');

        $limit = min(max((int) $request->query('limit', 10), 1), 100);
        $page = max((int) $request->query('page', 1), 1);

        $total = (clone $query)->count();
        $rows = (clone $query)
            ->skip(($page - 1) * $limit)
            ->take($limit)
            ->get();

        return response()->json([
            'data' => $rows,
            'meta' => [
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
                'last_page' => max((int) ceil($total / $limit), 1),
            ],
            'error' => null,
        ]);
    }

    /**
     * Bulk import penempatan dari baris XLSX yang sudah diparse di frontend.
     * Data hanya masuk melalui impor ini (tidak ada form manual).
     */
    public function import(Request $request)
    {
        @ini_set('max_execution_time', 300);

        $data = $request->validate([
            'rows' => ['required', 'array', 'min:1'],
            'rows.*' => ['array'],
            'replace' => ['nullable', 'boolean'],
        ]);

        $replace = ! empty($data['replace']);
        $imported = 0;
        $errors = [];
        $payloads = [];

        foreach ($data['rows'] as $index => $row) {
            $row = is_array($row) ? $row : [];
            // Parser frontend menyertakan nomor baris asli pada file XLSX.
            $line = (int) ($row['__line'] ?? ((int) $index + 2));

            try {
                $alumniName = trim((string) ($row['alumni_name'] ?? ''));
                if (mb_strlen($alumniName) < 2) {
                    throw new \RuntimeException('Nama alumni wajib diisi (minimal 2 karakter).');
                }

                $payloads[] = [
                    'year' => (int) ($row['year'] ?? now()->format('Y')),
                    'month' => mb_substr(trim((string) ($row['month'] ?? '')), 0, 50),
                    'school_name' => trim((string) ($row['school_name'] ?? '')),
                    'alumni_name' => $alumniName,
                    'gender' => mb_substr(trim((string) ($row['gender'] ?? '')), 0, 20),
                    'birth_place' => trim((string) ($row['birth_place'] ?? '')),
                    'birth_date' => trim((string) ($row['birth_date'] ?? '')),
                    'nik' => mb_substr(preg_replace('/\s+/', '', (string) ($row['nik'] ?? '')), 0, 32),
                    'ak1_no' => mb_substr(trim((string) ($row['ak1_no'] ?? '')), 0, 64),
                    'address' => trim((string) ($row['address'] ?? '')),
                    'district' => trim((string) ($row['district'] ?? '')),
                    'province' => trim((string) ($row['province'] ?? '')),
                    'regency' => trim((string) ($row['regency'] ?? '')),
                    'email' => mb_substr(trim((string) ($row['email'] ?? '')), 0, 191),
                    'major' => trim((string) ($row['major'] ?? '')),
                    'position' => trim((string) ($row['position'] ?? '')),
                    'status' => mb_substr(trim((string) ($row['status'] ?? '')), 0, 50),
                    'company_name' => trim((string) ($row['company_name'] ?? '')),
                    'company_business_type' => trim((string) ($row['company_business_type'] ?? '')),
                    'business_field' => trim((string) ($row['business_field'] ?? '')),
                    'company_address' => trim((string) ($row['company_address'] ?? '')),
                    'company_province' => trim((string) ($row['company_province'] ?? '')),
                    'company_regency' => trim((string) ($row['company_regency'] ?? '')),
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            } catch (\Throwable $e) {
                $errors[] = ['line' => $line, 'message' => $e->getMessage()];
            }
        }

        DB::transaction(function () use ($payloads, $replace, &$imported) {
            if ($replace) {
                BkkPlacement::query()->delete();
            }
            foreach (array_chunk($payloads, 200) as $chunk) {
                BkkPlacement::insert($chunk);
                $imported += count($chunk);
            }
        });

        return response()->json([
            'data' => [
                'imported' => $imported,
                'failed' => count($errors),
                'total' => count($data['rows']),
                'errors' => $errors,
            ],
            'error' => null,
        ]);
    }

    public function destroy(string $id)
    {
        $placement = BkkPlacement::findOrFail($id);
        $placement->delete();

        return response()->json(['data' => null, 'error' => null]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'month' => ['required', 'string', 'max:50'],
            'school_name' => ['nullable', 'string'],
            'alumni_name' => ['required', 'string', 'min:2', 'max:191'],
            'gender' => ['nullable', 'string', 'max:20'],
            'birth_place' => ['nullable', 'string'],
            'birth_date' => ['nullable', 'string'],
            'nik' => ['nullable', 'string', 'max:32'],
            'ak1_no' => ['nullable', 'string', 'max:64'],
            'address' => ['nullable', 'string'],
            'district' => ['nullable', 'string'],
            'province' => ['nullable', 'string'],
            'regency' => ['nullable', 'string'],
            'email' => ['nullable', 'string', 'max:191'],
            'major' => ['nullable', 'string'],
            'position' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'max:50'],
            'company_name' => ['nullable', 'string'],
            'company_business_type' => ['nullable', 'string'],
            'business_field' => ['nullable', 'string'],
            'company_address' => ['nullable', 'string'],
            'company_province' => ['nullable', 'string', 'max:32'],
            'company_regency' => ['nullable', 'string'],
        ]);

        $data['nik'] = preg_replace('/\s+/', '', $data['nik'] ?? '');

        $placement = BkkPlacement::create($data);

        return response()->json(['data' => $placement, 'error' => null], 201);
    }
}
