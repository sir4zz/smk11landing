<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->string('doc_kk')->nullable()->after('foto');
            $table->string('doc_akta')->nullable()->after('doc_kk');
            $table->string('doc_ijazah')->nullable()->after('doc_akta');
            $table->string('doc_lainnya')->nullable()->after('doc_ijazah');
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn(['doc_kk', 'doc_akta', 'doc_ijazah', 'doc_lainnya']);
        });
    }
};