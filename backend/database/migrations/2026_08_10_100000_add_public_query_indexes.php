<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('news', function (Blueprint $table) {
            // category is TEXT on MySQL; date is the useful sortable/filterable part.
            $table->index('date', 'news_date_index');
        });

        Schema::table('achievements', function (Blueprint $table) {
            $table->index('year', 'achievements_year_index');
        });

        Schema::table('teacher_activities', function (Blueprint $table) {
            $table->index('date', 'teacher_activities_date_index');
        });

        Schema::table('mading_categories', function (Blueprint $table) {
            $table->index('sort_order', 'mading_categories_sort_order_index');
        });

        Schema::table('mading_posts', function (Blueprint $table) {
            $table->index(['status', 'published_at'], 'mading_posts_status_published_at_index');
            $table->index(['author_id', 'status', 'published_at'], 'mading_posts_author_status_published_at_index');
            $table->index(['category_id', 'status', 'published_at'], 'mading_posts_category_status_published_at_index');
        });

        Schema::table('osis_members', function (Blueprint $table) {
            $table->index('sort_order', 'osis_members_sort_order_index');
        });

        Schema::table('osis_activities', function (Blueprint $table) {
            $table->index('activity_date', 'osis_activities_activity_date_index');
        });

        Schema::table('kesemaptaan_activities', function (Blueprint $table) {
            $table->index('activity_date', 'kesemaptaan_activities_activity_date_index');
        });

        Schema::table('kesemaptaan_instructors', function (Blueprint $table) {
            $table->index('sort_order', 'kesemaptaan_instructors_sort_order_index');
        });

        Schema::table('faqs', function (Blueprint $table) {
            $table->index('sort_order', 'faqs_sort_order_index');
        });

        Schema::table('contact_messages', function (Blueprint $table) {
            $table->index('created_at', 'contact_messages_created_at_index');
        });

        Schema::table('galleries', function (Blueprint $table) {
            $table->index(['is_published', 'event_date', 'created_at'], 'galleries_public_listing_index');
        });

        Schema::table('job_vacancies', function (Blueprint $table) {
            $table->index(['is_published', 'status', 'deadline', 'created_at'], 'jobs_public_listing_index');
        });
    }

    public function down(): void
    {
        Schema::table('job_vacancies', fn (Blueprint $table) => $table->dropIndex('jobs_public_listing_index'));
        Schema::table('galleries', function (Blueprint $table) {
            $table->dropIndex('galleries_public_listing_index');
        });
        Schema::table('contact_messages', fn (Blueprint $table) => $table->dropIndex('contact_messages_created_at_index'));
        Schema::table('faqs', fn (Blueprint $table) => $table->dropIndex('faqs_sort_order_index'));
        Schema::table('kesemaptaan_instructors', fn (Blueprint $table) => $table->dropIndex('kesemaptaan_instructors_sort_order_index'));
        Schema::table('kesemaptaan_activities', fn (Blueprint $table) => $table->dropIndex('kesemaptaan_activities_activity_date_index'));
        Schema::table('osis_activities', fn (Blueprint $table) => $table->dropIndex('osis_activities_activity_date_index'));
        Schema::table('osis_members', fn (Blueprint $table) => $table->dropIndex('osis_members_sort_order_index'));
        Schema::table('mading_posts', function (Blueprint $table) {
            $table->dropIndex('mading_posts_status_published_at_index');
            $table->dropIndex('mading_posts_author_status_published_at_index');
            $table->dropIndex('mading_posts_category_status_published_at_index');
        });
        Schema::table('mading_categories', fn (Blueprint $table) => $table->dropIndex('mading_categories_sort_order_index'));
        Schema::table('teacher_activities', fn (Blueprint $table) => $table->dropIndex('teacher_activities_date_index'));
        Schema::table('achievements', fn (Blueprint $table) => $table->dropIndex('achievements_year_index'));
        Schema::table('news', fn (Blueprint $table) => $table->dropIndex('news_date_index'));
    }
};
