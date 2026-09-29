<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('class_students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_class_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['school_class_id', 'student_user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('class_students');
    }
};

