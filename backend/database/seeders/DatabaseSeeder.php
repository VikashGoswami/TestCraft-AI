<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Institution;
use App\Models\InstitutionMember;
use App\Models\SchoolClass;
use App\Models\Test;
use App\Models\Question;
use App\Models\Option;
use App\Models\TestShare;
use App\Enums\TestVisibility;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Roles
        $this->call(RolesSeeder::class);

        // 2. Demo Institution Admin
        $admin = User::firstOrCreate(
            ['email' => 'admin@mcq.com'],
            [
                'name' => 'Dr. Eleanor Vance (Admin)',
                'password' => Hash::make('password'),
                'provider' => 'local',
                'email_verified_at' => now(),
            ]
        );
        $admin->syncRoles(['institution_admin']);

        // Institution
        $institution = Institution::firstOrCreate(
            ['name' => 'Apex Academy'],
            [
                'owner_user_id' => $admin->id,
                'plan' => 'pro',
                'status' => 'active',
            ]
        );
        $admin->update(['institution_id' => $institution->id]);

        // 3. Demo Teacher
        $teacher = User::firstOrCreate(
            ['email' => 'teacher@mcq.com'],
            [
                'name' => 'Prof. Marcus Chen (Teacher)',
                'password' => Hash::make('password'),
                'provider' => 'local',
                'institution_id' => $institution->id,
                'email_verified_at' => now(),
            ]
        );
        $teacher->syncRoles(['teacher']);

        InstitutionMember::firstOrCreate(
            ['institution_id' => $institution->id, 'user_id' => $teacher->id],
            ['role' => 'teacher', 'status' => 'active']
        );

        // Class
        $class = SchoolClass::firstOrCreate(
            ['institution_id' => $institution->id, 'name' => 'Batch 2026 - Physics & Math'],
            [
                'teacher_id' => $teacher->id,
                'join_code' => 'APEX26',
            ]
        );

        // 4. Demo Student
        $student = User::firstOrCreate(
            ['email' => 'student@mcq.com'],
            [
                'name' => 'Alex Rivera (Student)',
                'password' => Hash::make('password'),
                'provider' => 'local',
                'institution_id' => $institution->id,
                'email_verified_at' => now(),
            ]
        );
        $student->syncRoles(['student']);
        $class->students()->syncWithoutDetaching([$student->id => ['student_user_id' => $student->id]]);

        // 5. Demo Individual Creator
        $individual = User::firstOrCreate(
            ['email' => 'demo@mcq.com'],
            [
                'name' => 'Sarah Jenkins (Creator)',
                'password' => Hash::make('password'),
                'provider' => 'local',
                'email_verified_at' => now(),
            ]
        );
        $individual->syncRoles(['individual']);

        // 6. Demo Test with Questions & Options for Individual Creator
        $test = Test::firstOrCreate(
            ['creator_id' => $individual->id, 'title' => 'General Science & Mathematics Quiz'],
            [
                'description' => 'A comprehensive 20-minute diagnostic quiz covering Algebra, Geometry, and Mechanics.',
                'duration_minutes' => 20,
                'visibility' => TestVisibility::Public,
                'passing_score' => 60,
                'shuffle_questions' => true,
                'shuffle_options' => true,
                'status' => 'published',
                'owner_type' => 'individual',
            ]
        );

        // Questions
        $questionsData = [
            [
                'text' => 'What is the value of x if 3x + 7 = 22?',
                'topic' => 'Algebra',
                'difficulty' => 'easy',
                'options' => [
                    ['text' => '3', 'correct' => false],
                    ['text' => '5', 'correct' => true],
                    ['text' => '7', 'correct' => false],
                    ['text' => '15', 'correct' => false],
                ],
            ],
            [
                'text' => 'What is the sum of the interior angles of a quadrilateral?',
                'topic' => 'Geometry',
                'difficulty' => 'easy',
                'options' => [
                    ['text' => '180°', 'correct' => false],
                    ['text' => '270°', 'correct' => false],
                    ['text' => '360°', 'correct' => true],
                    ['text' => '540°', 'correct' => false],
                ],
            ],
            [
                'text' => 'What is the acceleration due to gravity on Earth’s surface (approximately)?',
                'topic' => 'Physics',
                'difficulty' => 'easy',
                'options' => [
                    ['text' => '9.8 m/s²', 'correct' => true],
                    ['text' => '8.9 m/s²', 'correct' => false],
                    ['text' => '10.5 m/s²', 'correct' => false],
                    ['text' => '6.4 m/s²', 'correct' => false],
                ],
            ],
            [
                'text' => 'If a right-angled triangle has legs of length 6 and 8, what is the length of the hypotenuse?',
                'topic' => 'Geometry',
                'difficulty' => 'medium',
                'options' => [
                    ['text' => '9', 'correct' => false],
                    ['text' => '10', 'correct' => true],
                    ['text' => '12', 'correct' => false],
                    ['text' => '14', 'correct' => false],
                ],
            ],
            [
                'text' => 'Solve for y: 2y² - 8 = 0.',
                'topic' => 'Algebra',
                'difficulty' => 'medium',
                'options' => [
                    ['text' => 'y = ±2', 'correct' => true],
                    ['text' => 'y = 4', 'correct' => false],
                    ['text' => 'y = ±4', 'correct' => false],
                    ['text' => 'y = 2 only', 'correct' => false],
                ],
            ],
        ];

        foreach ($questionsData as $idx => $qData) {
            $question = Question::firstOrCreate(
                ['test_id' => $test->id, 'question_text' => $qData['text']],
                [
                    'topic' => $qData['topic'],
                    'difficulty' => $qData['difficulty'],
                    'order_index' => $idx + 1,
                ]
            );

            foreach ($qData['options'] as $opt) {
                Option::firstOrCreate(
                    ['question_id' => $question->id, 'option_text' => $opt['text']],
                    ['is_correct' => $opt['correct']]
                );
            }
        }

        // Demo Share Link
        TestShare::firstOrCreate(
            ['test_id' => $test->id, 'slug' => 'science-demo'],
            [
                'created_by_user_id' => $individual->id,
                'label' => 'Public Practice Link',
                'view_count' => 12,
                'start_count' => 8,
                'completion_count' => 6,
            ]
        );

        $this->command->info('=== DEMO ACCOUNTS READY ===');
        $this->command->info('Individual : demo@mcq.com / password');
        $this->command->info('Teacher    : teacher@mcq.com / password');
        $this->command->info('Student    : student@mcq.com / password');
        $this->command->info('Admin      : admin@mcq.com / password');
        $this->command->info('Demo Link  : /take/science-demo');
    }
}
