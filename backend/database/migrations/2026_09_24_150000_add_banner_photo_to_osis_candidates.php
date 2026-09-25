<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('osis_candidates', function (Blueprint $table) {
            $table->text('banner_photo')->default('')->after('wakil_photo');
        });
    }

    public function down(): void
    {
        Schema::table('osis_candidates', function (Blueprint $table) {
            $table->dropColumn('banner_photo');
        });
    }
};
