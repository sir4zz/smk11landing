<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bkk_placements', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
            $table->unsignedInteger('year')->default(0)->index();
            $table->string('month', 20)->default('');
            $table->text('school_name')->default('');
            $table->string('alumni_name', 191)->default('');
            $table->text('gender')->default('');
            $table->text('birth_place')->default('');
            $table->text('birth_date')->default('');
            $table->text('nik')->default('');
            $table->text('ak1_no')->default('');
            $table->text('address')->default('');
            $table->text('district')->default('');
            $table->text('province')->default('');
            $table->text('regency')->default('');
            $table->text('email')->default('');
            $table->text('major')->default('');
            $table->text('position')->default('');
            $table->text('status')->default('');
            $table->text('company_name')->default('');
            $table->text('company_business_type')->default('');
            $table->text('business_field')->default('');
            $table->text('company_address')->default('');
            $table->text('company_province')->default('');
            $table->text('company_regency')->default('');
            $table->timestamps();

            $table->index('alumni_name');
            $table->index(['year', 'month']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bkk_placements');
    }
};
