<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;

class StatsController extends Controller
{
    public function index()
    {
        $studentCount = DB::table('students')->count();
        $staffCount = DB::table('staff')->count();
        $educationStaffCount = DB::table('education_staff')->count();
        $programCount = DB::table('programs')->count();

        $totalStaff = $staffCount + $educationStaffCount;

        return response()->json([
            'data' => [
                ['value' => number_format($studentCount, 0, ',', '.'), 'label' => 'Siswa Aktif'],
                ['value' => number_format($totalStaff, 0, ',', '.'), 'label' => 'Tenaga Pengajar'],
                ['value' => (string) $programCount, 'label' => 'Program Keahlian'],
            ],
        ]);
    }
}
