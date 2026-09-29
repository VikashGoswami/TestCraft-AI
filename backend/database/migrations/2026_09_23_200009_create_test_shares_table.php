<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('test_shares', function (Blueprint $table) {
            $table->id();
            $table->foreignId('test_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by_user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->string('label')->nullable();
            $table->string('slug')->unique();
            $table->unsignedInteger('max_participants')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->unsignedInteger('view_count')->default(0);
            $table->unsignedInteger('start_count')->default(0);
            $table->unsignedInteger('completion_count')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('test_shares');
    }
};

