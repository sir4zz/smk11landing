<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sops', function (Blueprint $table) {
            // Keep the legacy column for old records, but allow new Drive-only records.
            if (Schema::hasColumn('sops', 'file_path')) $table->string('file_path')->nullable()->change();
            if (! Schema::hasColumn('sops', 'drive_url')) $table->string('drive_url')->nullable()->after('category');
            if (! Schema::hasColumn('sops', 'drive_file_id')) $table->string('drive_file_id')->nullable()->after('drive_url');
        });
    }

    public function down(): void
    {
        // Deliberately retain these columns on rollback so migrated SOP metadata is not lost.
    }
};
