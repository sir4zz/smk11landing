<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreign('id')->references('id')->on('users')->onDelete('cascade');
            $table->text('nisn')->unique();
            $table->string('nis', 50)->nullable()->unique();
            $table->string('pin', 255)->default('');
            $table->text('name')->default('');
            $table->string('nickname', 100)->nullable();
            $table->text('class')->default('');
            $table->text('major')->default('');
            $table->json('achievements')->default('[]');
            $table->string('gender', 20)->default('');
            $table->date('date_of_birth')->nullable();
            $table->text('place_of_birth')->default('');
            $table->string('religion', 50)->nullable();
            $table->string('kewarganegaraan', 50)->nullable();
            $table->unsignedTinyInteger('anak_ke')->nullable();
            $table->unsignedTinyInteger('jml_saudara_kandung')->nullable();
            $table->unsignedTinyInteger('jml_saudara_tiri')->nullable();
            $table->string('anak_yatim_piatu', 30)->nullable();
            $table->string('bahasa_sehari_hari', 50)->nullable();
            $table->text('address')->default('');
            $table->string('phone', 30)->nullable();
            $table->string('tinggal_dengan', 60)->nullable();
            $table->decimal('jarak_sekolah', 5, 2)->nullable();
            $table->string('golongan_darah', 5)->nullable();
            $table->text('penyakit')->nullable();
            $table->text('kelainan_jasmani')->nullable();
            $table->unsignedSmallInteger('tinggi_cm')->nullable();
            $table->unsignedSmallInteger('berat_kg')->nullable();
            $table->string('lulusan_dari', 255)->nullable();
            $table->date('tanggal_sttb')->nullable();
            $table->string('nomor_sttb', 100)->nullable();
            $table->string('lama_belajar', 20)->nullable();
            $table->string('pindahan_dari', 255)->nullable();
            $table->string('alasan_pindah', 255)->nullable();
            $table->string('diangkat', 100)->nullable();
            $table->string('kompetensi_keahlian', 255)->nullable();
            $table->date('tanggal_diterima')->nullable();
            foreach (['ayah', 'ibu', 'wali'] as $parent) {
                $table->string("{$parent}_nama", 255)->nullable();
                $table->string("{$parent}_tempat", 255)->nullable();
                $table->date("{$parent}_tanggal_lahir")->nullable();
                $table->string("{$parent}_agama", 50)->nullable();
                $table->string("{$parent}_kewarganegaraan", 50)->nullable();
                $table->string("{$parent}_pendidikan", 100)->nullable();
                $table->string("{$parent}_pekerjaan", 100)->nullable();
                $table->string("{$parent}_penghasilan", 100)->nullable();
                $table->text("{$parent}_alamat")->nullable();
                $table->string("{$parent}_no_telp", 30)->nullable();
                $table->string("{$parent}_status_hidup", 60)->nullable();
            }
            $table->string('gemar_kesenian', 100)->nullable();
            $table->string('gemar_olahraga', 100)->nullable();
            $table->string('gemar_kemasyarakatan', 100)->nullable();
            $table->string('gemar_lain', 100)->nullable();
            $table->string('siswa_status', 60)->nullable();
            $table->date('siswa_tanggal')->nullable();
            $table->text('foto')->nullable();
            $table->timestamps();
        });

        Schema::create('student_accounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreign('id')->references('id')->on('users')->onDelete('cascade');
            $table->foreignUuid('student_id')->references('id')->on('students')->onDelete('cascade');
            $table->text('email')->unique();
            $table->string('status', 20)->default('active');
            $table->timestamps();
        });

        // PPDB
        Schema::create('ppdb_registrations', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
            $table->foreignUuid('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->text('registration_number')->nullable();
            $table->text('full_name')->nullable();
            $table->text('nisn')->nullable();
            $table->text('nik')->nullable();
            $table->text('gender')->nullable();
            $table->text('place_of_birth')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->text('religion')->nullable();
            $table->text('address')->nullable();
            $table->text('phone')->nullable();
            $table->text('father_name')->nullable();
            $table->text('father_occupation')->nullable();
            $table->text('mother_name')->nullable();
            $table->text('mother_occupation')->nullable();
            $table->text('guardian_name')->nullable();
            $table->text('guardian_phone')->nullable();
            $table->text('parent_address')->nullable();
            $table->text('previous_school')->nullable();
            $table->text('previous_school_address')->nullable();
            $table->text('graduation_year')->nullable();
            $table->text('program')->nullable();
            $table->integer('documents_count')->default(0);
            $table->text('status')->default('Menunggu Verifikasi');
            $table->text('admin_note')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
        });

        Schema::create('ppdb_documents', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
            $table->foreignUuid('application_id')->references('id')->on('ppdb_registrations')->onDelete('cascade');
            $table->text('type')->nullable();
            $table->text('filename')->nullable();
            $table->text('file_path')->nullable();
            $table->text('mime_type')->nullable();
            $table->integer('file_size')->nullable();
            $table->smallInteger('verified')->default(0);
            $table->text('note')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('ppdb_activity_log', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
            $table->foreignUuid('application_id')->references('id')->on('ppdb_registrations')->onDelete('cascade');
            $table->text('action')->nullable();
            $table->text('note')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('student_data_change_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('student_id')->references('id')->on('students')->onDelete('cascade');
            $table->json('old_data')->default('{}');
            $table->json('proposed_data')->default('{}');
            $table->text('status')->default('menunggu');
            $table->text('rejection_reason')->nullable();
            $table->foreignUuid('verified_by')->nullable()->references('id')->on('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ppdb_activity_log');
        Schema::dropIfExists('ppdb_documents');
        Schema::dropIfExists('ppdb_registrations');
        Schema::dropIfExists('student_accounts');
        Schema::dropIfExists('student_data_change_requests');
        Schema::dropIfExists('students');
    }
};
