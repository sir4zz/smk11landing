<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('osis_elections', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->text('title')->default('');
            $table->text('description')->default('');
            $table->boolean('is_active')->default(false);
            $table->timestamps();
        });

        Schema::create('osis_candidates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('election_id')->references('id')->on('osis_elections')->onDelete('cascade');
            $table->unsignedInteger('number')->default(1);
            $table->text('name')->default('');
            $table->text('class')->default('');
            $table->text('vision')->default('');
            $table->text('mission')->default('');
            $table->text('photo')->default('');
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index('sort_order', 'osis_candidates_sort_order_index');
        });

        Schema::create('osis_votes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('election_id')->references('id')->on('osis_elections')->onDelete('cascade');
            $table->foreignUuid('candidate_id')->references('id')->on('osis_candidates')->onDelete('cascade');
            $table->foreignUuid('student_id')->references('id')->on('users')->onDelete('cascade');
            $table->timestamps();
            $table->unique(['election_id', 'student_id'], 'osis_votes_election_student_unique');
            $table->index('candidate_id', 'osis_votes_candidate_id_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('osis_votes');
        Schema::dropIfExists('osis_candidates');
        Schema::dropIfExists('osis_elections');
    }
};
