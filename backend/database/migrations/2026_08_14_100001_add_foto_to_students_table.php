<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('students', 'foto')) {
            Schema::table('students', function (Blueprint $table) {
                $table->text('foto')->nullable();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('students', 'foto')) {
            Schema::table('students', function (Blueprint $table) {
                $table->dropColumn('foto');
            });
        }
    }
};