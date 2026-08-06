<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('faqs', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
            $table->text('question');
            $table->text('answer');
            $table->text('category')->default('');
            $table->integer('sort_order')->default(0);
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('faqs');
    }
};
