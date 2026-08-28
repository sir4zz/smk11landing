<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('facilities', function (Blueprint $table) {
            $table->text('slug')->nullable()->after('name');
        });

        // Backfill slugs from existing names
        $rows = DB::table('facilities')->select('id', 'name')->get();
        foreach ($rows as $row) {
            $base = \Illuminate\Support\Str::slug($row->name);
            $slug = $base ?: 'fasilitas-' . substr($row->id, 0, 8);
            $i = 2;
            while (DB::table('facilities')->where('slug', $slug)->where('id', '!=', $row->id)->exists()) {
                $slug = $base . '-' . $i;
                $i++;
            }
            DB::table('facilities')->where('id', $row->id)->update(['slug' => $slug]);
        }

        Schema::table('facilities', function (Blueprint $table) {
            $table->text('slug')->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('facilities', function (Blueprint $table) {
            $table->dropColumn('slug');
        });
    }
};
