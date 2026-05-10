<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Challenges table
        Schema::create('ctf_challenges', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->string('category'); // web, crypto, forensics, reverse, osint, misc
            $table->string('difficulty'); // easy, medium, hard, insane
            $table->integer('points');
            $table->string('flag'); // The correct flag (e.g. FLAG{...})
            $table->text('hint')->nullable();
            $table->string('attachment_url')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Solves table (tracks who solved what)
        Schema::create('ctf_solves', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('challenge_id')->constrained('ctf_challenges')->onDelete('cascade');
            $table->integer('points_awarded');
            $table->boolean('hint_used')->default(false);
            $table->timestamps();
            $table->unique(['user_id', 'challenge_id']); // One solve per user per challenge
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ctf_solves');
        Schema::dropIfExists('ctf_challenges');
    }
};
