<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Institution;
use App\Models\InstitutionMember;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InstitutionController extends Controller
{
    public function show(Institution $institution)
    {
        $this->authorize('view', $institution);

        return response()->json($institution->load('owner'));
    }

    /**
     * Create a new institution and promote the creator to institution_admin.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $institution = DB::transaction(function () use ($data, $request) {
            $institution = Institution::create([
                'name' => $data['name'],
                'owner_user_id' => $request->user()->id,
            ]);

            $request->user()->update(['institution_id' => $institution->id]);
            $request->user()->syncRoles(['institution_admin']);

            return $institution;
        });

        return response()->json($institution, 201);
    }

    public function teachers(Institution $institution)
    {
        $this->authorize('manage', $institution);

        $teachers = $institution->members()
            ->where('role', 'teacher')
            ->with('user')
            ->get();

        return response()->json($teachers);
    }

    /**
     * Invite a teacher by email — creates a stub user if they don't exist yet.
     */
    public function inviteTeacher(Request $request, Institution $institution)
    {
        $this->authorize('manageTeachers', $institution);

        $data = $request->validate(['email' => 'required|email']);

        $user = User::firstOrCreate(
            ['email' => $data['email']],
            ['name' => explode('@', $data['email'])[0], 'provider' => 'local']
        );

        $member = InstitutionMember::firstOrCreate([
            'institution_id' => $institution->id,
            'user_id' => $user->id,
        ], [
            'role' => 'teacher',
            'status' => 'invited',
        ]);

        if ($member->wasRecentlyCreated) {
            $user->update(['institution_id' => $institution->id]);
            $user->assignRole('teacher');
        }

        return response()->json($member->load('user'), 201);
    }
}

