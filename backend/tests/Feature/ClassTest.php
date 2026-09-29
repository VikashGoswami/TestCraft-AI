<?php

namespace Tests\Feature;

use App\Models\Institution;
use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ClassTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::firstOrCreate(['name' => 'student', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'teacher', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'institution_admin', 'guard_name' => 'web']);
    }

    public function test_student_can_join_class_with_valid_code(): void
    {
        $teacher = User::factory()->create();
        $institution = Institution::create([
            'name' => 'Demo High School',
            'owner_user_id' => $teacher->id,
        ]);

        $class = SchoolClass::create([
            'institution_id' => $institution->id,
            'teacher_id' => $teacher->id,
            'name' => 'Physics Batch A',
            'join_code' => 'PHYS01',
        ]);

        $student = User::factory()->create();
        Sanctum::actingAs($student);

        $response = $this->postJson('/api/v1/classes/join', [
            'join_code' => 'PHYS01',
        ]);

        $response->assertStatus(200);
        $response->assertJsonFragment(['message' => 'Joined class successfully.']);

        $this->assertDatabaseHas('class_students', [
            'school_class_id' => $class->id,
            'student_user_id' => $student->id,
        ]);

        // Student can now fetch their enrolled classes
        $myClassesResponse = $this->getJson('/api/v1/classes/my');
        $myClassesResponse->assertStatus(200);
        $myClassesResponse->assertJsonFragment(['name' => 'Physics Batch A']);
    }

    public function test_invalid_class_code_returns_404(): void
    {
        $student = User::factory()->create();
        Sanctum::actingAs($student);

        $response = $this->postJson('/api/v1/classes/join', [
            'join_code' => 'INVALID',
        ]);

        $response->assertStatus(404);
        $response->assertJsonFragment(['message' => 'Invalid or expired class code.']);
    }
}

