<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class StatsController extends Controller
{
    public const CACHE_KEY = 'public:stats';

    public function index()
    {
        return response()->json(Cache::remember(self::CACHE_KEY, now()->addSeconds(30), static function () {
            $studentCount = DB::table('students')->count();
            $staffCount = DB::table('staff')->count();
            $educationStaffCount = DB::table('education_staff')->count();
            $programCount = DB::table('programs')->count();

            return [
                'data' => [
                    ['value' => number_format($studentCount, 0, ',', '.'), 'label' => 'Siswa Aktif'],
                    ['value' => number_format($staffCount + $educationStaffCount, 0, ',', '.'), 'label' => 'Tenaga Pengajar'],
                    ['value' => (string) $programCount, 'label' => 'Program Keahlian'],
                ],
            ];
        }));
    }
}
