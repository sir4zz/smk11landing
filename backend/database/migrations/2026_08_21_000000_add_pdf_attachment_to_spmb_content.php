<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('spmb_content', function (Blueprint $table) {
            $table->text('pdf_attachment')->nullable()->after('banner_description');
        });
    }

    public function down(): void
    {
        Schema::table('spmb_content', function (Blueprint $table) {
            $table->dropColumn('pdf_attachment');
        });
    }
};
