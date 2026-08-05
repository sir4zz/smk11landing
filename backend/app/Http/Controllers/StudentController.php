<?php

namespace App\Http\Controllers;

use App\Models\Profile;
use App\Models\Student;
use App\Models\StudentAccount;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class StudentController extends Controller
{
    public function index(Request $request)
    {
        $query = Student::query();

        if ($request->has('search')) {
            $term = '%'.$request->query('search').'%';
            $query->where(function ($q) use ($term) {
                $q->where('name', 'ilike', $term)->orWhere('nisn', 'ilike', $term);
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
            'p_class' => ['nullable', 'string'],
            'p_major' => ['nullable', 'string'],
            'p_pin' => ['required', 'string'],
        ]);

        if (strlen(trim($data['p_nisn'])) < 4) {
            throw ValidationException::withMessages(['message' => 'NISN tidak valid']);
        }
        if (strlen($data['p_pin']) < 4) {
            throw ValidationException::withMessages(['message' => 'PIN minimal 4 karakter']);
        }

        $nisn = trim($data['p_nisn']);
        $email = 'nisn-'.$nisn.'@mading.smkn11.sch.id';

        if (Student::query()->where('nisn', $nisn)->exists() || User::query()->where('email', $email)->exists()) {
            throw ValidationException::withMessages(['message' => 'NISN sudah terdaftar']);
        }

        $id = (string) \Illuminate\Support\Str::uuid();

        try {
            DB::transaction(function () use ($id, $email, $data, $nisn) {
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

                Student::create([
                    'id' => $id,
                    'nisn' => $nisn,
                    'name' => $data['p_name'],
                    'class' => $data['p_class'] ?? '',
                    'major' => $data['p_major'] ?? '',
                ]);

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

        return response()->json(['data' => null, 'error' => null]);
    }

    public function destroy(string $studentId)
    {
        $student = Student::findOrFail($studentId);

        StudentAccount::query()->where('student_id', $student->id)->delete();
        Student::query()->where('id', $student->id)->delete();
        User::query()->where('id', $student->id)->delete();

        return response()->json(['data' => null, 'error' => null]);
    }
}
