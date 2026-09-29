<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Test;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class TestControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::firstOrCreate(['name' => 'individual', 'guard_name' => 'web']);
    }

    public function test_unauthenticated_user_cannot_access_tests(): void
    {
        $response = $this->getJson('/api/v1/tests');
        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_access_tests_with_authorize(): void
    {
        $user = User::factory()->create();
        $user->assignRole('individual');
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/tests');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data',
            'links',
            'meta',
        ]);
    }

    public function test_authenticated_user_can_create_test_with_authorize(): void
    {
        $user = User::factory()->create();
        $user->assignRole('individual');
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/v1/tests', [
            'title' => 'Math Assessment',
            'description' => 'Test algebra concepts',
            'duration_minutes' => 45,
            'visibility' => 'public',
            'passing_score' => 60,
            'shuffle_questions' => true,
            'shuffle_options' => true,
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('data.title', 'Math Assessment');
        $this->assertDatabaseHas('tests', ['title' => 'Math Assessment', 'creator_id' => $user->id]);
    }
}
