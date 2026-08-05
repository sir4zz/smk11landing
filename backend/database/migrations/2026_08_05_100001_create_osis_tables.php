<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // OSIS profile (single row)
        Schema::create('osis', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->text('name')->default('');
            $table->text('description')->default('');
            $table->text('period')->default('');
            $table->text('logo')->default('');
            $table->timestamp('updated_at')->useCurrent();
        });

        Schema::create('osis_members', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('osis_id')->nullable()->references('id')->on('osis')->onDelete('cascade');
            $table->text('name')->default('');
            $table->text('position')->default('');
            $table->text('division')->default('');
            $table->text('photo')->default('');
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('osis_activities', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->text('title')->default('');
            $table->text('description')->default('');
            $table->text('photo')->default('');
            $table->date('activity_date')->nullable();
            $table->string('status', 20)->default('published');
            $table->timestamps();
        });

        // EXTRACURRICULARS
        Schema::create('extracurriculars', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->text('name')->default('');
            $table->text('slug')->unique();
            $table->text('category')->default('');
            $table->text('description')->default('');
            $table->text('photo')->default('');
            $table->text('advisor')->default('');
            $table->text('schedule')->default('');
            $table->text('place')->default('');
            $table->jsonb('achievements')->default('[]');
            $table->jsonb('documentation')->default('[]');
            $table->string('status', 20)->default('published');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('extracurriculars');
        Schema::dropIfExists('osis_activities');
        Schema::dropIfExists('osis_members');
        Schema::dropIfExists('osis');
    }
};
