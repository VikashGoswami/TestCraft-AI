<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('institutions', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('owner_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('plan')->default('free');
            $table->string('status')->default('active');
            $table->string('logo_path')->nullable();
            $table->timestamps();
        });

        // Add the deferred FK from users to institutions
        Schema::table('users', function (Blueprint $table) {
            $table->foreign('institution_id')->references('id')->on('institutions')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['institution_id']);
        });
        Schema::dropIfExists('institutions');
    }
};

