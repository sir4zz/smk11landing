<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('alumni_graduations', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
            $table->text('name')->default('');
            $table->text('nisn')->default('');
            $table->text('major')->default('');
            $table->integer('graduation_year')->default(0);
            $table->text('phone')->default('');
            $table->text('email')->default('');
            $table->text('domicile')->default('');
            $table->text('status')->default('belum_bekerja');
            $table->json('status_detail')->nullable();
            $table->text('verification_status')->default('menunggu');
            $table->text('verification_note')->default('');
            $table->text('submitted_by')->default('');
            $table->timestamps();

            $table->index('graduation_year');
            $table->index('major');
            $table->index('status');
            $table->index('verification_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alumni_graduations');
    }
};
