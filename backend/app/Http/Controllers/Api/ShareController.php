<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateShareRequest;
use App\Http\Resources\ShareResource;
use App\Models\Test;
use App\Models\TestShare;
use App\Services\ShareTrackingService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ShareController extends Controller
{
    public function __construct(private readonly ShareTrackingService $shareTracking) {}

    public function store(CreateShareRequest $request, Test $test)
    {
        $this->authorize('share', $test);

        $share = TestShare::create(array_merge($request->validated(), [
            'test_id' => $test->id,
            'created_by_user_id' => $request->user()->id,
            'slug' => $this->generateUniqueSlug(),
        ]));

        return new ShareResource($share);
    }

    public function index(Test $test)
    {
        $this->authorize('share', $test);

        return ShareResource::collection($test->shares()->latest()->get());
    }

    /**
     * Public endpoint — resolve a share slug and return test preview info.
     * Records a session-deduplicated view.
     */
    public function resolve(Request $request, string $slug)
    {
        $share = TestShare::where('slug', $slug)
            ->with('test.creator')
            ->firstOrFail();

        if ($this->shareTracking->isExpired($share)) {
            return response()->json(['message' => 'This link has expired.'], 410);
        }

        $this->shareTracking->recordView($share, $request);

        return response()->json([
            'share' => new ShareResource($share),
            'test' => [
                'id' => $share->test->id,
                'title' => $share->test->title,
                'description' => $share->test->description,
                'duration_minutes' => $share->test->duration_minutes,
                'question_count' => $share->test->questions()->count(),
                'creator' => $share->test->creator->name,
            ],
        ]);
    }

    /**
     * Generate a cryptographically random 10-character unique slug.
     */
    private function generateUniqueSlug(): string
    {
        do {
            $slug = Str::random(10);
        } while (TestShare::where('slug', $slug)->exists());

        return $slug;
    }
}

