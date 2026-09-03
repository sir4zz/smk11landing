<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            foreach (['asal_sekolah', 'nik', 'email', 'desa', 'kode_pos', 'no_kk', 'kepala_keluarga', 'no_kip', 'cita_cita', 'hobi', 'pernah_paud', 'pernah_tk', 'status_afirmasi', 'jenis_tempat_tinggal', 'jarak_tempuh', 'transportasi', 'beasiswa_status', 'beasiswa_tk', 'beasiswa_dari'] as $column) {
                $table->text($column)->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn(['asal_sekolah', 'nik', 'email', 'desa', 'kode_pos', 'no_kk', 'kepala_keluarga', 'no_kip', 'cita_cita', 'hobi', 'pernah_paud', 'pernah_tk', 'status_afirmasi', 'jenis_tempat_tinggal', 'jarak_tempuh', 'transportasi', 'beasiswa_status', 'beasiswa_tk', 'beasiswa_dari']);
        });
    }
};
