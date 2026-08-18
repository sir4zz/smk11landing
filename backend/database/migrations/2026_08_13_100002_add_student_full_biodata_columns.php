<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            // Section 1 — Keterangan Peserta Didik
            $table->string('nickname', 100)->nullable()->after('name');
            $table->string('kewarganegaraan', 50)->nullable()->after('religion');
            $table->tinyInteger('anak_ke')->unsigned()->nullable()->after('kewarganegaraan');
            $table->tinyInteger('jml_saudara_kandung')->unsigned()->nullable()->after('anak_ke');
            $table->tinyInteger('jml_saudara_tiri')->unsigned()->nullable()->after('jml_saudara_kandung');
            $table->string('anak_yatim_piatu', 30)->nullable()->after('jml_saudara_tiri');
            $table->string('bahasa_sehari_hari', 50)->nullable()->after('anak_yatim_piatu');

            // Section 2 — Keterangan Tempat Tinggal
            $table->string('phone', 30)->nullable()->after('address');
            $table->string('tinggal_dengan', 60)->nullable()->after('phone');
            $table->decimal('jarak_sekolah', 5, 2)->nullable()->after('tinggal_dengan');

            // Section 3 — Keterangan Kesehatan
            $table->string('golongan_darah', 5)->nullable()->after('jarak_sekolah');
            $table->text('penyakit')->nullable()->after('golongan_darah');
            $table->text('kelainan_jasmani')->nullable()->after('penyakit');
            $table->smallInteger('tinggi_cm')->unsigned()->nullable()->after('kelainan_jasmani');
            $table->smallInteger('berat_kg')->unsigned()->nullable()->after('tinggi_cm');

            // Section 4 — Keterangan Pendidikan
            $table->string('lulusan_dari', 255)->nullable()->after('berat_kg');
            $table->date('tanggal_sttb')->nullable()->after('lulusan_dari');
            $table->string('nomor_sttb', 100)->nullable()->after('tanggal_sttb');
            $table->string('lama_belajar', 20)->nullable()->after('nomor_sttb');
            $table->string('pindahan_dari', 255)->nullable()->after('lama_belajar');
            $table->string('alasan_pindah', 255)->nullable()->after('pindahan_dari');
            $table->string('diangkat', 100)->nullable()->after('alasan_pindah');
            $table->string('kompetensi_keahlian', 255)->nullable()->after('diangkat');
            $table->date('tanggal_diterima')->nullable()->after('kompetensi_keahlian');

            // Section 5-7 — Ayah / Ibu / Wali
            foreach (['ayah', 'ibu', 'wali'] as $p) {
                $table->string("{$p}_nama", 255)->nullable();
                $table->string("{$p}_tempat", 255)->nullable();
                $table->date("{$p}_tanggal_lahir")->nullable();
                $table->string("{$p}_agama", 50)->nullable();
                $table->string("{$p}_kewarganegaraan", 50)->nullable();
                $table->string("{$p}_pendidikan", 100)->nullable();
                $table->string("{$p}_pekerjaan", 100)->nullable();
                $table->string("{$p}_penghasilan", 100)->nullable();
                $table->text("{$p}_alamat")->nullable();
                $table->string("{$p}_no_telp", 30)->nullable();
                $table->string("{$p}_status_hidup", 60)->nullable();
            }

            // Section 8 — Kegemaran Siswa
            $table->string('gemar_kesenian', 100)->nullable();
            $table->string('gemar_olahraga', 100)->nullable();
            $table->string('gemar_kemasyarakatan', 100)->nullable();
            $table->string('gemar_lain', 100)->nullable();

            // Section 9 — Keterangan Perkembangan Siswa
            $table->string('beasiswa_tk', 60)->nullable();
            $table->string('beasiswa_dari', 100)->nullable();

            // Section 10 — Keterangan Siswa
            $table->string('siswa_status', 60)->nullable();
            $table->date('siswa_tanggal')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            foreach (['ayah', 'ibu', 'wali'] as $p) {
                foreach (['nama', 'tempat', 'tanggal_lahir', 'agama', 'kewarganegaraan', 'pendidikan', 'pekerjaan', 'penghasilan', 'alamat', 'no_telp', 'status_hidup'] as $c) {
                    $table->dropColumn("{$p}_{$c}");
                }
            }

            $table->dropColumn([
                // Section 1
                'nickname', 'kewarganegaraan', 'anak_ke', 'jml_saudara_kandung', 'jml_saudara_tiri',
                'anak_yatim_piatu', 'bahasa_sehari_hari',
                // Section 2
                'phone', 'tinggal_dengan', 'jarak_sekolah',
                // Section 3
                'golongan_darah', 'penyakit', 'kelainan_jasmani', 'tinggi_cm', 'berat_kg',
                // Section 4
                'lulusan_dari', 'tanggal_sttb', 'nomor_sttb', 'lama_belajar', 'pindahan_dari',
                'alasan_pindah', 'diangkat', 'kompetensi_keahlian', 'tanggal_diterima',
                // Section 8
                'gemar_kesenian', 'gemar_olahraga', 'gemar_kemasyarakatan', 'gemar_lain',
                // Section 9
                'beasiswa_tk', 'beasiswa_dari',
                // Section 10
                'siswa_status', 'siswa_tanggal',
            ]);
        });
    }
};