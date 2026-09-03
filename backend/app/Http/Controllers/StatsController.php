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

            // Hitung tenaga pengajar dari modul SDM (guru + tendik aktif)
            $sdmGuruCount = DB::table('sdm_gurus')->where('is_active', true)->count();
            $sdmTendikCount = DB::table('sdm_tendiks')->where('is_active', true)->count();
            // Fallback ke tabel legacy jika modul SDM kosong
            if ($sdmGuruCount === 0 && $sdmTendikCount === 0) {
                $staffCount = DB::table('staff')->count();
                $educationStaffCount = DB::table('education_staff')->count();
                $totalStaff = $staffCount + $educationStaffCount;
            } else {
                $totalStaff = $sdmGuruCount + $sdmTendikCount;
            }

            $programCount = DB::table('programs')->count();

            return [
                'data' => [
                    ['value' => number_format($studentCount, 0, ',', '.'), 'label' => 'Siswa Aktif'],
                    ['value' => number_format($totalStaff, 0, ',', '.'), 'label' => 'Tenaga Pengajar'],
                    ['value' => (string) $programCount, 'label' => 'Program Keahlian'],
                ],
            ];
        }));
    }
}
