<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // PROFILES
        Schema::create('profiles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreign('id')->references('id')->on('users')->onDelete('cascade');
            $table->string('role', 50)->default('applicant');
            $table->text('name')->nullable();
            $table->text('phone')->nullable();
            $table->text('email')->nullable();
            $table->timestamp('updated_at')->useCurrent();
        });

        // CONTENT RECORDS (legacy fallback container)
        Schema::create('content_records', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
            $table->text('content_type');
            $table->jsonb('data');
            $table->timestamps();
        });

        // CONTACT MESSAGES
        Schema::create('contact_messages', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
            $table->text('name');
            $table->text('email');
            $table->text('subject');
            $table->text('message');
            $table->smallInteger('is_read')->default(0);
            $table->timestamp('created_at')->useCurrent();
        });

        // NEWS
        Schema::create('news', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
            $table->text('title');
            $table->text('slug')->unique();
            $table->date('date')->default(DB::raw('(CURRENT_DATE)'));
            $table->text('excerpt')->default('');
            $table->text('content')->default('');
            $table->text('thumbnail')->default('');
            $table->text('category')->default('');
            $table->text('author')->default('');
            $table->text('source_type')->default('manual');
            $table->text('source_label')->default('Berita mandiri');
            $table->text('source_note')->default('');
            $table->text('source_url')->default('');
            $table->timestamps();
        });

        // PROGRAMS
        Schema::create('programs', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
            $table->text('name');
            $table->text('slug')->unique();
            $table->text('short_name')->default('');
            $table->text('icon')->default('');
            $table->text('image')->default('');
            $table->text('description')->default('');
            $table->text('short_description')->default('');
            $table->jsonb('competencies')->default('[]');
            $table->jsonb('career_prospects')->default('[]');
            $table->jsonb('facilities')->default('[]');
            $table->timestamps();
        });

        // FACILITIES
        Schema::create('facilities', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
            $table->text('name');
            $table->text('description')->default('');
            $table->text('category')->default('');
            $table->text('photo')->default('');
            $table->timestamps();
        });

        // STAFF
        Schema::create('staff', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
            $table->text('name');
            $table->text('position')->default('');
            $table->text('department')->default('');
            $table->text('photo')->default('');
            $table->text('description')->default('');
            $table->timestamps();
        });

        // ACHIEVEMENTS
        Schema::create('achievements', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
            $table->text('title');
            $table->text('event')->default('');
            $table->integer('year')->default(DB::raw('(EXTRACT(YEAR FROM CURRENT_DATE))'));
            $table->text('level')->default('');
            $table->text('rank')->default('');
            $table->jsonb('students')->default('[]');
            $table->text('photo')->default('');
            $table->timestamps();
        });

        // TEACHER ACTIVITIES
        Schema::create('teacher_activities', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
            $table->text('title');
            $table->date('date')->default(DB::raw('(CURRENT_DATE)'));
            $table->text('category')->default('');
            $table->text('description')->default('');
            $table->text('photo')->default('');
            $table->timestamps();
        });

        // EDUCATION STAFF
        Schema::create('education_staff', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
            $table->text('name');
            $table->text('position')->default('');
            $table->text('department')->default('');
            $table->text('photo')->default('');
            $table->timestamps();
        });

        // SPMB CONTENT (single-row config)
        Schema::create('spmb_content', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
            $table->string('status', 20)->default('ditutup');
            $table->text('title')->default('Seleksi Penerimaan Murid Baru (SPMB)');
            $table->text('description')->default('');
            $table->text('latest_info')->default('');
            $table->jsonb('requirements')->default('[]');
            $table->jsonb('schedule')->default('[]');
            $table->jsonb('flow_steps')->default('[]');
            $table->jsonb('faq')->default('[]');
            $table->text('portal_url')->default('https://spmb.bantenprov.go.id');
            $table->text('banner_image')->default('');
            $table->text('banner_title')->default('');
            $table->text('banner_description')->default('');
            $table->timestamps();
        });

        // ROLES
        Schema::create('roles', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
            $table->string('slug', 50)->unique();
            $table->string('name', 100);
            $table->timestamp('created_at')->useCurrent();
        });

        // PERMISSIONS
        Schema::create('permissions', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
            $table->string('slug', 100)->unique();
            $table->string('name', 150);
            $table->string('module', 100)->default('');
            $table->timestamp('created_at')->useCurrent();
        });

        // ROLE PERMISSIONS
        Schema::create('role_permissions', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
            $table->foreignUuid('role_id')->references('id')->on('roles')->onDelete('cascade');
            $table->foreignUuid('permission_id')->references('id')->on('permissions')->onDelete('cascade');
            $table->unique(['role_id', 'permission_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('role_permissions');
        Schema::dropIfExists('permissions');
        Schema::dropIfExists('roles');
        Schema::dropIfExists('spmb_content');
        Schema::dropIfExists('education_staff');
        Schema::dropIfExists('teacher_activities');
        Schema::dropIfExists('achievements');
        Schema::dropIfExists('staff');
        Schema::dropIfExists('facilities');
        Schema::dropIfExists('programs');
        Schema::dropIfExists('news');
        Schema::dropIfExists('contact_messages');
        Schema::dropIfExists('content_records');
        Schema::dropIfExists('profiles');
    }
};
