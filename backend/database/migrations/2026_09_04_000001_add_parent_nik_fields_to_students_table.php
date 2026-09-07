<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->string('ayah_nik', 30)->nullable()->after('ayah_no_telp');
            $table->string('ibu_nik', 30)->nullable()->after('ibu_no_telp');
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn(['ayah_nik', 'ibu_nik']);
        });
    }
};
