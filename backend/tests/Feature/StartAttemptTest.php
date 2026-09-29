<?php

namespace Tests\Feature;

use App\Models\Test;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class StartAttemptTest extends TestCase
{
    use RefreshDatabase;

    protected Test $test;

    protected function setUp(): void
    {
        parent::setUp();
        Role::firstOrCreate(['name' => 'individual', 'guard_name' => 'web']);

        $creator = User::factory()->create();
        $creator->assignRole('individual');

        $this->test = Test::create([
            'creator_id' => $creator->id,
            'title' => 'Sample Assessment',
            'duration_minutes' => 30,
            'visibility' => 'public',
            'status' => 'published',
        ]);
    }

    public function test_guest_without_name_and_email_fails_with_clear_error_messages(): void
    {
        $response = $this->postJson("/api/v1/tests/{$this->test->id}/attempts", []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['guest_name', 'guest_email']);
        $response->assertJsonFragment([
            'guest_name' => ['Name is required to start the test without login.'],
            'guest_email' => ['Email ID is required to start the test without login.'],
        ]);
    }

    public function test_guest_with_name_and_email_starts_attempt_successfully(): void
    {
        $response = $this->postJson("/api/v1/tests/{$this->test->id}/attempts", [
            'guest_name' => 'Jane Candidate',
            'guest_email' => 'jane@example.com',
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('data.guest_name', 'Jane Candidate');
        $response->assertJsonPath('data.guest_email', 'jane@example.com');
        $this->assertDatabaseHas('attempts', [
            'test_id' => $this->test->id,
            'guest_name' => 'Jane Candidate',
            'guest_email' => 'jane@example.com',
        ]);
    }

    public function test_logged_in_user_starts_test_normally_without_guest_fields(): void
    {
        $user = User::factory()->create(['name' => 'Logged User', 'email' => 'logged@example.com']);
        $user->assignRole('individual');
        Sanctum::actingAs($user);

        // No guest_name or guest_email provided
        $response = $this->postJson("/api/v1/tests/{$this->test->id}/attempts", []);

        $response->assertStatus(201);
        $response->assertJsonPath('data.user.id', $user->id);
        $response->assertJsonPath('data.guest_name', 'Logged User');
        $response->assertJsonPath('data.guest_email', 'logged@example.com');
        $this->assertDatabaseHas('attempts', [
            'test_id' => $this->test->id,
            'user_id' => $user->id,
        ]);
    }
}
