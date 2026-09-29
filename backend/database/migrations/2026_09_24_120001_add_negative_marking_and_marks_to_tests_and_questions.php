<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tests', function (Blueprint $table) {
            $table->boolean('has_negative_marking')->default(false)->after('passing_score');
            $table->decimal('negative_mark', 4, 2)->default(0.25)->after('has_negative_marking');
        });

        Schema::table('questions', function (Blueprint $table) {
            $table->decimal('marks', 5, 2)->default(1.00)->after('difficulty');
        });
    }

    public function down(): void
    {
        Schema::table('tests', function (Blueprint $table) {
            $table->dropColumn(['has_negative_marking', 'negative_mark']);
        });

        Schema::table('questions', function (Blueprint $table) {
            $table->dropColumn('marks');
        });
    }
};
