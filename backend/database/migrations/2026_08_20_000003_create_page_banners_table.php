<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('page_banners', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
            $table->text('page_key')->default('');
            $table->text('title')->default('');
            $table->text('subtitle')->default('');
            $table->text('image')->default('');
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->unique('page_key');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('page_banners');
    }
};
