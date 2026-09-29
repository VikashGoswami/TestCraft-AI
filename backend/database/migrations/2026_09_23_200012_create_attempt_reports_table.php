<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attempt_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attempt_id')->constrained()->cascadeOnDelete()->unique();
            $table->json('strong_topics')->nullable();
            $table->json('weak_topics')->nullable();
            $table->text('ai_summary')->nullable();
            $table->json('topic_advice')->nullable();
            $table->enum('generation_status', ['pending', 'completed', 'failed_fallback'])->default('pending');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attempt_reports');
    }
};

