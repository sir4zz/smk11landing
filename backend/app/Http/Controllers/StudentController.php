<?php

namespace App\Http\Controllers;

use App\Models\Profile;
use App\Models\Student;
use App\Models\StudentAccount;
use App\Models\User;
use App\Services\AccountService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class StudentController extends Controller
{
    public function __construct(protected AccountService $accounts)
    {
    }

    public function index(Request $request)
    {
        $query = Student::query();

        if ($request->has('search')) {
            $term = '%'.$request->query('search').'%';
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', $term)->orWhere('nisn', 'like', $term);
            });
        }

        if ($request->has('id')) {
            $query->where('id', $request->query('id'));
        }

        $query->orderBy('name', 'asc');

        return response()->json($query->get());
    }

    /**
     * Replica of admin_create_student(p_nisn, p_name, p_class, p_major, p_pin).
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'p_nisn' => ['required', 'string'],
            'p_name' => ['required', 'string'],
            'p_nis' => ['nullable', 'string'],
            'p_class' => ['nullable', 'string'],
            'p_major' => ['nullable', 'string'],
            'p_gender' => ['nullable', 'string'],
            'p_date_of_birth' => ['nullable', 'string'],
            'p_place_of_birth' => ['nullable', 'string'],
            'p_religion' => ['nullable', 'string'],
            'p_address' => ['nullable', 'string'],
            'p_pin' => ['required', 'string'],
            'p_foto' => ['nullable', 'string'],
        ]);

        if (strlen(trim($data['p_nisn'])) < 4) {
            throw ValidationException::withMessages(['message' => 'NISN tidak valid']);
        }
        if (strlen($data['p_pin']) < 4) {
            throw ValidationException::withMessages(['message' => 'PIN minimal 4 karakter']);
        }

        $nisn = trim($data['p_nisn']);
        $nis = trim($data['p_nis'] ?? '');
        $email = $this->accounts->studentEmail($nisn);

        if (Student::query()->where('nisn', $nisn)->exists() || User::query()->where('email', $email)->exists()) {
            throw ValidationException::withMessages(['message' => 'NISN sudah terdaftar']);
        }
        if ($nis !== '' && Student::query()->where('nis', $nis)->exists()) {
            throw ValidationException::withMessages(['message' => 'NIS sudah terdaftar']);
        }

        $id = (string) \Illuminate\Support\Str::uuid();

        try {
            DB::transaction(function () use ($id, $email, $data, $nisn, $nis) {
                User::create([
                    'id' => $id,
                    'email' => $email,
                    'password' => Hash::make($data['p_pin']),
                    'name' => $data['p_name'],
                    'profile' => ['name' => $data['p_name']],
                    'email_verified_at' => now(),
                ]);

                Profile::create([
                    'id' => $id,
                    'role' => 'student',
                    'name' => $data['p_name'],
                    'email' => $email,
                    'updated_at' => now(),
                ]);

                Student::create(array_merge([
                    'id' => $id,
                    'nisn' => $nisn,
                    'nis' => $nis !== '' ? $nis : null,
                    'pin' => $data['p_pin'],
                    'name' => $data['p_name'],
                    'class' => $data['p_class'] ?? '',
                    'major' => $data['p_major'] ?? '',
                    'gender' => $this->accounts->normalizeGender($data['p_gender'] ?? ''),
                    'date_of_birth' => $this->accounts->normalizeDate($data['p_date_of_birth'] ?? null),
                    'place_of_birth' => $data['p_place_of_birth'] ?? '',
                    'religion' => $data['p_religion'] ?? '',
                    'address' => $data['p_address'] ?? '',
                    'foto' => $data['p_foto'] ?? null,
                ], $this->accounts->biodata($data)));

                StudentAccount::create([
                    'id' => $id,
                    'student_id' => $id,
                    'email' => $email,
                    'status' => 'active',
                ]);
            });
        } catch (\Throwable $e) {
            throw ValidationException::withMessages(['message' => 'Gagal membuat akun siswa']);
        }

        return response()->json(Student::find($id), 201);
    }

    /**
     * Bulk import siswa from spreadsheet rows. Each row creates a login
     * account (NISN + PIN, PIN di-generate bila tidak dikirim).
     */
    public function import(Request $request)
    {
        // Impor ratusan siswa (Hash::make + beberapa insert per baris) bisa
        // melebihi max_execution_time default server; pastikan cukup waktu.
        @ini_set('max_execution_time', 600);

        $data = $request->validate([
            'rows' => ['required', 'array', 'min:1'],
            'default_pin' => ['nullable', 'string'],
        ]);

        $defaultPin = trim((string) ($data['default_pin'] ?? ''));
        $imported = 0;
        $skipped = 0;
        $errors = [];
        $seen = [];
        $seenNis = [];
        // Hash sekali per PIN unik (bcrypt rounds 10) agar impor cepat.
        $pinHashes = [];

        foreach ($data['rows'] as $index => $row) {
            $row = is_array($row) ? $row : [];
            // Template BIODATA: tiap sheet 3 baris header (judul, nama kolom, contoh),
            // data dimulai dari baris ke-4. Frontend sudah menggabungkan antar-sheet per NISN.
            $line = (int) $index + 4;
            $nisn = '';

            try {
                $nisn = trim((string) ($row['nisn'] ?? ''));
                $name = trim((string) ($row['name'] ?? ''));
                $nis = trim((string) ($row['nis'] ?? ''));
                $class = Student::normalizeClass($row['class'] ?? '');

                if ($nisn === '' || mb_strlen($nisn) < 4) {
                    throw new \RuntimeException('NISN tidak valid (minimal 4 karakter).');
                }
                if (mb_strlen($name) < 2) {
                    throw new \RuntimeException('Nama wajib diisi (minimal 2 karakter).');
                }
                if ($class !== '' && ! Student::isValidClass($class)) {
                    throw new \RuntimeException('Kelas "'.$class.'" tidak valid. Kelas harus berupa X, XI, atau XII.');
                }

                $email = $this->accounts->studentEmail($nisn);
                if (isset($seen[$nisn]) || Student::query()->where('nisn', $nisn)->exists() || User::query()->where('email', $email)->exists()) {
                    throw new \RuntimeException('NISN sudah terdaftar.');
                }
                $seen[$nisn] = true;

                if ($nis !== '' && (isset($seenNis[$nis]) || Student::query()->where('nis', $nis)->exists())) {
                    throw new \RuntimeException('NIS sudah terdaftar.');
                }
                $seenNis[$nis] = true;

                $pin = $this->defaultPin($nisn, $defaultPin);
                $password = $pinHashes[$pin] ??= Hash::make($pin, ['rounds' => 10]);
                $id = (string) \Illuminate\Support\Str::uuid();

                DB::transaction(function () use ($id, $email, $nisn, $nis, $name, $row, $pin, $password, $class) {
                    User::create([
                        'id' => $id,
                        'email' => $email,
                        'password' => $password,
                        'name' => $name,
                        'profile' => ['name' => $name],
                        'email_verified_at' => now(),
                    ]);

                    Profile::create([
                        'id' => $id,
                        'role' => 'student',
                        'name' => $name,
                        'email' => $email,
                        'updated_at' => now(),
                    ]);

                    Student::create(array_merge([
                        'id' => $id,
                        'nisn' => $nisn,
                        'nis' => $nis !== '' ? $nis : null,
                        'pin' => $pin,
                        'name' => $name,
                        'class' => $class,
                        'major' => trim((string) ($row['major'] ?? '')),
                        'gender' => $this->accounts->normalizeGender($row['gender'] ?? ''),
                        'date_of_birth' => $this->accounts->normalizeDate($row['date_of_birth'] ?? null),
                        'place_of_birth' => trim((string) ($row['place_of_birth'] ?? '')),
                        'religion' => trim((string) ($row['religion'] ?? '')),
                        'address' => trim((string) ($row['address'] ?? '')),
                    ], $this->accounts->biodata($row)));

                    StudentAccount::create([
                        'id' => $id,
                        'student_id' => $id,
                        'email' => $email,
                        'status' => 'active',
                    ]);
                });

                $imported++;
            } catch (\Throwable $e) {
                $skipped++;
                $errors[] = [
                    'row' => (int) $line,
                    'nisn' => $nisn,
                    'message' => $e->getMessage(),
                ];
            }
        }

        return response()->json([
            'data' => [
                'imported' => $imported,
                'skipped' => $skipped,
                'errors' => $errors,
            ],
            'error' => null,
        ]);
    }

    private function defaultPin(string $nisn, string $providedPin): string
    {
        $pin = trim($providedPin);
        if (mb_strlen($pin) >= 4) {
            return $pin;
        }

        $digits = preg_replace('/\D/', '', $nisn);
        if ($digits !== null && strlen($digits) >= 4) {
            return substr($digits, -4);
        }

        return '1234';
    }

    /**
     * Replica of admin_reset_student_pin(p_student_id, p_new_pin).
     */
    public function resetPin(Request $request, string $studentId)
    {
        $data = $request->validate([
            'p_new_pin' => ['required', 'string'],
        ]);

        if (strlen($data['p_new_pin']) < 4) {
            throw ValidationException::withMessages(['message' => 'PIN minimal 4 karakter']);
        }

        $student = Student::findOrFail($studentId);

        User::query()->where('id', $student->id)->update(['password' => Hash::make($data['p_new_pin'])]);
        $student->update(['pin' => $data['p_new_pin']]);

        return response()->json(['data' => null, 'error' => null]);
    }

    public function destroy(string $studentId)
    {
        $student = Student::findOrFail($studentId);

        foreach (['foto', 'doc_kk', 'doc_akta', 'doc_ijazah', 'doc_lainnya'] as $fileKey) {
            if ($student->{$fileKey}) {
                $this->deleteStoredFile($student->{$fileKey});
            }
        }

        StudentAccount::query()->where('student_id', $student->id)->delete();
        Student::query()->where('id', $student->id)->delete();
        User::query()->where('id', $student->id)->delete();

        return response()->json(['data' => null, 'error' => null]);
    }

    /**
     * Unduh foto / dokumen siswa melalui API (Laravel) sehingga header CORS
     * selalu diterapkan. File statis /storage biasa dilewati web server sehingga
     * tidak membawa header Access-Control-Allow-Origin dan fetch() dari SPA
     * frontend akan diblokir browser.
     */
    public function downloadFile(Request $request)
    {
        $path = trim((string) $request->query('path', ''));

        $prefix = '/storage/';
        if (str_starts_with($path, $prefix)) {
            $path = substr($path, strlen($prefix));
        }

        // Whitelist: hanya foto profil / dokumen siswa yang boleh diakses.
        $allowedPrefixes = ['photos/', 'student/documents/'];
        $allowed = false;
        foreach ($allowedPrefixes as $p) {
            if (str_starts_with($path, $p)) {
                $allowed = true;
                break;
            }
        }
        if (! $allowed || $path === '' || str_contains($path, '..')) {
            return response()->json(['data' => null, 'error' => ['message' => 'File tidak ditemukan.']], 404);
        }

        $disk = \Illuminate\Support\Facades\Storage::disk('public');
        if ($disk->directoryExists($path) || ! $disk->exists($path)) {
            return response()->json(['data' => null, 'error' => ['message' => 'File tidak ditemukan.']], 404);
        }

        $filename = basename($path);

        return response()->download($disk->path($path), $filename, [
            'Content-Type' => $disk->mimeType($path) ?: 'application/octet-stream',
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
                // Kegagalan menghapus file tidak boleh menggagalkan operasi database.
            }
        }
    }
}
