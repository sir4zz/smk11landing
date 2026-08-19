<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gurus', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreign('id')->references('id')->on('users')->onDelete('cascade');
            $table->string('nip', 50)->nullable()->unique();
            $table->string('nuptk', 50)->nullable()->unique();
            $table->string('teacher_id', 50)->unique();
            $table->text('subject')->default('');
            $table->text('position')->default('');
            $table->json('achievements')->default('[]');
            $table->json('certifications')->default('[]');
            $table->timestamps();
        });

        Schema::create('osis_accounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreign('id')->references('id')->on('users')->onDelete('cascade');
            $table->string('member_id', 50)->unique();
            $table->string('nisn', 50)->nullable()->unique();
            $table->text('division')->default('');
            $table->text('position')->default('');
            $table->json('achievements')->default('[]');
            $table->json('work_programs')->default('[]');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('osis_accounts');
        Schema::dropIfExists('gurus');
    }
};
