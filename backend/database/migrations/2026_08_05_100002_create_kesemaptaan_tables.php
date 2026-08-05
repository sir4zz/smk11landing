<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kesemaptaan', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->text('title')->default('');
            $table->text('description')->default('');
            $table->text('photo')->default('');
            $table->timestamp('updated_at')->useCurrent();
        });

        Schema::create('kesemaptaan_activities', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->text('title')->default('');
            $table->text('description')->default('');
            $table->date('activity_date')->nullable();
            $table->jsonb('documentation')->default('[]');
            $table->string('status', 20)->default('published');
            $table->timestamps();
        });

        Schema::create('kesemaptaan_schedules', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->text('day')->default('');
            $table->text('time')->default('');
            $table->text('place')->default('');
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('kesemaptaan_instructors', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->text('name')->default('');
            $table->text('role')->default('');
            $table->text('photo')->default('');
            $table->integer('sort_order')->default(0);
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('kesemaptaan_achievements', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->text('name')->default('');
            $table->text('year')->default('');
            $table->text('description')->default('');
            $table->jsonb('documentation')->default('[]');
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kesemaptaan_achievements');
        Schema::dropIfExists('kesemaptaan_instructors');
        Schema::dropIfExists('kesemaptaan_schedules');
        Schema::dropIfExists('kesemaptaan_activities');
        Schema::dropIfExists('kesemaptaan');
    }
};
