<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('extracurriculars', function (Blueprint $table) {
            $table->text('logo')->default('')->after('name');
            $table->text('short_description')->default('')->after('description');
            $table->text('full_description')->default('')->after('short_description');
            $table->jsonb('gallery')->default('[]')->after('documentation');
        });
    }

    public function down(): void
    {
        Schema::table('extracurriculars', function (Blueprint $table) {
            $table->dropColumn(['logo', 'short_description', 'full_description', 'gallery']);
        });
    }
};
