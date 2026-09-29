<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Institution;
use App\Models\SchoolClass;
use App\Models\Test;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ClassController extends Controller
{
    public function index(Institution $institution)
    {
        $this->authorize('view', $institution);

        $user = request()->user();

        $query = SchoolClass::where('institution_id', $institution->id)
            ->withCount('students');

        // Teachers only see their own classes unless they are also institution_admin.
        if ($user->hasRole('teacher') && !$user->hasRole('institution_admin')) {
            $query->where('teacher_id', $user->id);
        }

        return response()->json($query->get());
    }

    public function store(Request $request, Institution $institution)
    {
        $this->authorize('manage', $institution);

        $data = $request->validate(['name' => 'required|string|max:100']);

        $class = SchoolClass::create([
            'institution_id' => $institution->id,
            'teacher_id' => $request->user()->id,
            'name' => $data['name'],
            'join_code' => strtoupper(Str::random(6)),
        ]);

        return response()->json($class, 201);
    }

    /**
     * Add a student to a class by email (admin/teacher) or by join_code (student self-enrollment).
     */
    public function addStudent(Request $request, SchoolClass $class)
    {
        $this->authorize('manage', $class);

        $data = $request->validate([
            'email' => 'required_without:join_code|email',
            'join_code' => 'required_without:email|string',
        ]);

        if (isset($data['email'])) {
            $student = User::where('email', $data['email'])->firstOrFail();
        } else {
            $classFromCode = SchoolClass::where('join_code', strtoupper($data['join_code']))->firstOrFail();
            $student = $request->user();
            $class = $classFromCode;
        }

        $class->students()->syncWithoutDetaching([$student->id => ['student_user_id' => $student->id]]);
        $student->assignRole('student');

        return response()->json(['message' => 'Student added.']);
    }

    /**
     * Assign a test to a class and publish it in one step.
     */
    public function assignTest(Request $request, SchoolClass $class)
    {
        $this->authorize('manage', $class);

        $data = $request->validate(['test_id' => 'required|exists:tests,id']);

        $test = Test::findOrFail($data['test_id']);
        $this->authorize('update', $test);

        $test->update(['school_class_id' => $class->id, 'status' => 'published']);

        return response()->json(['message' => 'Test assigned to class.']);
    }

    /**
     * Self-enrollment for students using a 6-character class code.
     */
    public function join(Request $request)
    {
        $data = $request->validate([
            'join_code' => 'required|string',
        ]);

        $class = SchoolClass::where('join_code', strtoupper(trim($data['join_code'])))->first();
        if (!$class) {
            return response()->json(['message' => 'Invalid or expired class code.'], 404);
        }

        $user = $request->user();
        $class->students()->syncWithoutDetaching([$user->id => ['student_user_id' => $user->id]]);

        if (!$user->institution_id) {
            $user->update(['institution_id' => $class->institution_id]);
        }
        if (!$user->hasRole('student')) {
            $user->assignRole('student');
        }

        return response()->json([
            'message' => 'Joined class successfully.',
            'class' => $class->load('teacher:id,name'),
        ]);
    }

    /**
     * List enrolled classes for the authenticated student.
     */
    public function myClasses(Request $request)
    {
        $user = $request->user();
        $classes = $user->enrolledClasses()->with('teacher:id,name')->withCount('students')->get();
        return response()->json($classes);
    }
}

