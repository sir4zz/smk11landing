<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Allow one SPMB poster (announcement) to hold additional photos beyond the
 * primary cover image. The public page renders these extra photos as a
 * swipeable carousel inside the same poster card.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('spmb_posters', function (Blueprint $table) {
            $table->json('images')->nullable()->after('image');
        });
    }

    public function down(): void
    {
        Schema::table('spmb_posters', function (Blueprint $table) {
            $table->dropColumn('images');
        });
    }
};
