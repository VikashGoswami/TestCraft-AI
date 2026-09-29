<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Test;
use App\Models\TestTheme;
use Illuminate\Http\Request;

class ThemeController extends Controller
{
    /**
     * Create or replace the theme configuration for a test.
     * Uses updateOrCreate so repeated calls are idempotent.
     */
    public function store(Request $request, Test $test)
    {
        $this->authorize('update', $test);

        $data = $request->validate([
            'template_key' => 'required|in:corporate,focused,custom',
            'primary_color' => 'nullable|string|max:20',
            'accent_color' => 'nullable|string|max:20',
            'logo_path' => 'nullable|string|max:500',
            'layout_config' => 'nullable|array',
        ]);

        $theme = TestTheme::updateOrCreate(
            ['test_id' => $test->id],
            $data
        );

        return response()->json($theme);
    }
}

