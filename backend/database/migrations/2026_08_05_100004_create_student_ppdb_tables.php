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
            $table->text('name')->default('');
            $table->text('class')->default('');
            $table->text('major')->default('');
            $table->timestamps();

            $table->index('nisn');
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
    }

    public function down(): void
    {
        Schema::dropIfExists('ppdb_activity_log');
        Schema::dropIfExists('ppdb_documents');
        Schema::dropIfExists('ppdb_registrations');
        Schema::dropIfExists('student_accounts');
        Schema::dropIfExists('students');
    }
};
