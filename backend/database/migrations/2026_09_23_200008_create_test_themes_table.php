<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('test_themes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('test_id')->nullable();
            $table->unsignedBigInteger('institution_id')->nullable();
            $table->enum('template_key', ['corporate', 'focused', 'custom'])->default('focused');
            $table->string('primary_color')->default('#1a56db');
            $table->string('accent_color')->default('#7e3af2');
            $table->string('logo_path')->nullable();
            $table->json('layout_config')->nullable();
            $table->timestamps();

            $table->index('test_id');
            $table->index('institution_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('test_themes');
    }
};

