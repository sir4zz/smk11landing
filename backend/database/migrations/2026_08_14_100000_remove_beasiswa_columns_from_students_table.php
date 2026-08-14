<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $columns = [];

            if (Schema::hasColumn('students', 'beasiswa_tk')) {
                $columns[] = 'beasiswa_tk';
            }
            if (Schema::hasColumn('students', 'beasiswa_dari')) {
                $columns[] = 'beasiswa_dari';
            }
            if (Schema::hasColumn('students', 'menerima_beasiswa')) {
                $columns[] = 'menerima_beasiswa';
            }

            // Keep legacy scholarship data instead of silently destroying it.
            if ($columns !== [] && DB::table('students')->where(function ($query) use ($columns) {
                foreach ($columns as $column) {
                    $query->orWhereNotNull($column);
                }
            })->exists()) {
                throw new \RuntimeException(
                    'Cannot remove scholarship columns: students table contains scholarship data. Export or migrate it first.'
                );
            }

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            if (! Schema::hasColumn('students', 'beasiswa_tk')) {
                $table->string('beasiswa_tk', 60)->nullable();
            }
            if (! Schema::hasColumn('students', 'beasiswa_dari')) {
                $table->string('beasiswa_dari', 100)->nullable();
            }
            if (! Schema::hasColumn('students', 'menerima_beasiswa')) {
                $table->boolean('menerima_beasiswa')->nullable();
            }
        });
    }
};
