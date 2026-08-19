<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * SDM (Sumber Daya Manusia) module — Guru & Tenaga Kependidikan.
 *
 * The main records (sdm_gurus / sdm_tendiks) hold identity + employment +
 * contact data. Educational background, assignments, certifications, KGB and
 * appointment SK records live in dedicated child tables keyed by
 * (staff_type, staff_id) so the structure stays normalized instead of a
 * single wide table with dozens of columns.
 */
return new class extends Migration
{
    private const CHILD_TABLES = [
        'sdm_educations',
        'sdm_assignments',
        'sdm_certifications',
        'sdm_kgb',
        'sdm_sk_pengangkatans',
    ];

    public function up(): void
    {
        // ---- Main record: Guru ----
        Schema::create('sdm_gurus', function (Blueprint $table) {
            $this->mainColumns($table);
            $table->foreignUuid('user_id')->nullable()->references('id')->on('users')->onDelete('set null');
        });

        // ---- Main record: Tenaga Kependidikan ----
        Schema::create('sdm_tendiks', function (Blueprint $table) {
            $this->mainColumns($table);
            $table->foreignUuid('user_id')->nullable()->references('id')->on('users')->onDelete('set null');
        });

        // ---- Shared child records ----
        Schema::create('sdm_educations', function (Blueprint $table) {
            $this->childColumns($table);
            $table->string('jenjang', 50)->default('');
            $table->string('jurusan', 255)->default('');
            $table->string('perguruan_tinggi', 255)->default('');
            $table->integer('tahun_lulus')->nullable();
            $table->string('tempat', 255)->default('');
            $table->string('nomor_ijazah', 255)->default('');
            $table->date('tanggal_ijazah')->nullable();
        });

        Schema::create('sdm_assignments', function (Blueprint $table) {
            $this->childColumns($table);
            $table->string('jenis', 30)->default('tugas_tambahan');
            $table->string('uraian', 255)->default('');
            $table->string('jumlah_jam', 20)->default('');
        });

        Schema::create('sdm_certifications', function (Blueprint $table) {
            $this->childColumns($table);
            $table->string('status', 20)->default('');
            $table->string('no_sertifikat', 100)->default('');
            $table->string('no_peserta', 100)->default('');
            $table->string('no_nrg', 100)->default('');
            $table->string('bidang_studi', 255)->default('');
            $table->string('penyelenggara', 255)->default('');
            $table->integer('tahun_lulus')->nullable();
        });

        Schema::create('sdm_kgb', function (Blueprint $table) {
            $this->childColumns($table);
            $table->string('no_sk', 255)->default('');
            $table->date('tanggal_sk')->nullable();
            $table->string('gaji_pokok', 50)->default('');
            $table->string('mkg', 50)->default('');
            $table->date('tmt_kgb_akhir')->nullable();
            $table->date('tmt_kgb_berikutnya')->nullable();
        });

        Schema::create('sdm_sk_pengangkatans', function (Blueprint $table) {
            $this->childColumns($table);
            $table->string('kategori', 30)->default('');
            $table->string('nomor_sk', 255)->default('');
            $table->date('tanggal_sk')->nullable();
            $table->string('pejabat', 255)->default('');
        });
    }

    public function down(): void
    {
        foreach (array_reverse(self::CHILD_TABLES) as $table) {
            Schema::dropIfExists($table);
        }
        Schema::dropIfExists('sdm_tendiks');
        Schema::dropIfExists('sdm_gurus');
    }

    private function mainColumns(Blueprint $table): void
    {
        $table->uuid('id')->primary();
        $table->string('name', 255);
        $table->string('nip', 50)->nullable()->unique();
        $table->string('nipppk', 50)->nullable()->unique();
        $table->string('nuptk', 50)->nullable()->unique();
        $table->string('gender', 20)->default('');
        $table->string('religion', 50)->default('');
        $table->string('birth_place', 255)->default('');
        $table->date('birth_date')->nullable();
        $table->string('status_kepegawaian', 50)->default('');
        $table->string('pangkat_golongan', 100)->default('');
        $table->string('jabatan', 255)->default('');
        $table->date('tmt_golongan')->nullable();
        $table->date('tmt_cpns')->nullable();
        $table->date('tmt_pns_pppk')->nullable();
        $table->date('tmt_sk_sekolah')->nullable();
        $table->string('nik', 30)->nullable()->index();
        $table->text('address')->nullable();
        $table->string('phone', 50)->default('');
        $table->string('npwp', 50)->default('');
        $table->string('akta_lahir', 100)->default('');
        $table->string('bpjs', 100)->default('');
        $table->string('email', 255)->default('');
        foreach (['instagram', 'facebook', 'twitter', 'tiktok', 'youtube', 'linkedin', 'website', 'github'] as $social) {
            $table->string($social, 255)->default('');
        }
        $table->string('photo', 500)->default('');
        $table->text('bio')->nullable();
        $table->boolean('is_active')->default(true);
        $table->timestamps();
    }

    private function childColumns(Blueprint $table): void
    {
        $table->uuid('id')->primary();
        $table->string('staff_type', 10);
        $table->uuid('staff_id');
        $table->integer('sort_order')->default(0);
        $table->timestamps();

        $table->index(['staff_type', 'staff_id']);
    }
};
