<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Keep the newest copy before enforcing the singleton invariant.
        DB::table('content_records')
            ->select('content_type')
            ->groupBy('content_type')
            ->havingRaw('COUNT(*) > 1')
            ->pluck('content_type')
            ->each(function (string $contentType): void {
                $ids = DB::table('content_records')
                    ->where('content_type', $contentType)
                    ->orderByDesc('created_at')
                    ->orderByDesc('id')
                    ->pluck('id');

                DB::table('content_records')->whereIn('id', $ids->skip(1))->delete();
            });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE content_records ALTER COLUMN content_type TYPE VARCHAR(255)');
        } elseif (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE content_records MODIFY content_type VARCHAR(255) NOT NULL');
        } elseif (DB::getDriverName() === 'sqlite') {
            // SQLite accepts the unique index on the existing TEXT column.
        }

        Schema::table('content_records', function (Blueprint $table): void {
            $table->unique('content_type', 'content_records_content_type_unique');
        });
    }

    public function down(): void
    {
        Schema::table('content_records', function (Blueprint $table): void {
            $table->dropUnique('content_records_content_type_unique');
        });
    }
};
