<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\StudentAccount;
use Illuminate\Http\Request;

class StudentAuthController extends Controller
{
    /**
     * Replica of public.get_student_login_email(p_nisn):
     * resolve NISN -> student account email.
     */
    public function studentEmail(Request $request)
    {
        $data = $request->validate([
            'nisn' => ['required', 'string'],
        ]);

        $nisn = trim($data['nisn']);

        $email = Student::query()
            ->where('nisn', $nisn)
            ->with('account')
            ->get()
            ->first()
            ?->account
            ?->email;

        if (! $email) {
            return response()->json([
                'data' => null,
                'error' => ['message' => 'NISN tidak terdaftar.'],
            ], 404);
        }

        return response()->json(['data' => $email, 'error' => null]);
    }
}
