<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Satuan jarak_sekolah diubah dari KM menjadi Meter:
// perlebar kolom (meter bernilai lebih besar) lalu konversi data lama x1000.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->decimal('jarak_sekolah', 8, 2)->nullable()->change();
        });

        DB::statement('UPDATE `students` SET `jarak_sekolah` = `jarak_sekolah` * 1000 WHERE `jarak_sekolah` IS NOT NULL');
    }

    public function down(): void
    {
        DB::statement('UPDATE `students` SET `jarak_sekolah` = `jarak_sekolah` / 1000 WHERE `jarak_sekolah` IS NOT NULL');

        Schema::table('students', function (Blueprint $table) {
            $table->decimal('jarak_sekolah', 5, 2)->nullable()->change();
        });
    }
};
