<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// Koreksi data: migrasi 2026_08_21_000001 mengalikan seluruh jarak_sekolah x1000
// dengan asumsi nilai lama masih KM. Nyatanya sebagian nilai (hasil import/
// input terbaru) sudah METER sehingga ikut terinflasi (601 -> 601000).
// Field ini kini meter end-to-end: balikkan perkalian tersebut (bagi 1000).
// Tidak ada perubahan struktur; decimal(8,2) sudah tepat untuk meter desimal.
return new class extends Migration
{
    public function up(): void
    {
        DB::statement('UPDATE `students` SET `jarak_sekolah` = `jarak_sekolah` / 1000 WHERE `jarak_sekolah` IS NOT NULL');
    }

    public function down(): void
    {
        DB::statement('UPDATE `students` SET `jarak_sekolah` = `jarak_sekolah` * 1000 WHERE `jarak_sekolah` IS NOT NULL');
    }
};
