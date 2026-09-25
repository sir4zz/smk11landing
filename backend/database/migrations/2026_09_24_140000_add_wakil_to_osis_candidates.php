<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('osis_candidates', function (Blueprint $table) {
            $table->text('wakil_name')->default('')->after('class');
            $table->text('wakil_class')->default('')->after('wakil_name');
            $table->text('wakil_photo')->default('')->after('photo');
        });
    }

    public function down(): void
    {
        Schema::table('osis_candidates', function (Blueprint $table) {
            $table->dropColumn(['wakil_name', 'wakil_class', 'wakil_photo']);
        });
    }
};
