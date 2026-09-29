<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\AttemptStateService;
use App\Models\AttemptAnswer;
use App\Enums\QuestionState;

class AttemptStateServiceTest extends TestCase
{
    private AttemptStateService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new AttemptStateService();
    }

    public function test_not_visited_to_not_answered_on_visit()
    {
        $answer = new AttemptAnswer([
            'state' => QuestionState::NotVisited,
            'selected_option_id' => null,
        ]);

        // Reflection to test private computeTransition
        $reflection = new \ReflectionClass(AttemptStateService::class);
        $method = $reflection->getMethod('computeTransition');
        $method->setAccessible(true);

        [$newState, $optionId] = $method->invoke($this->service, $answer, 'visit', null);

        $this->assertEquals(QuestionState::NotAnswered, $newState);
        $this->assertNull($optionId);
    }

    public function test_save_with_option_becomes_answered()
    {
        $answer = new AttemptAnswer([
            'state' => QuestionState::NotAnswered,
            'selected_option_id' => null,
        ]);

        $reflection = new \ReflectionClass(AttemptStateService::class);
        $method = $reflection->getMethod('computeTransition');
        $method->setAccessible(true);

        [$newState, $optionId] = $method->invoke($this->service, $answer, 'save', 42);

        $this->assertEquals(QuestionState::Answered, $newState);
        $this->assertEquals(42, $optionId);
    }

    public function test_save_without_option_becomes_not_answered()
    {
        $answer = new AttemptAnswer([
            'state' => QuestionState::Answered,
            'selected_option_id' => 42,
        ]);

        $reflection = new \ReflectionClass(AttemptStateService::class);
        $method = $reflection->getMethod('computeTransition');
        $method->setAccessible(true);

        [$newState, $optionId] = $method->invoke($this->service, $answer, 'save', null);

        $this->assertEquals(QuestionState::NotAnswered, $newState);
        $this->assertNull($optionId);
    }

    public function test_mark_without_option_becomes_marked()
    {
        $answer = new AttemptAnswer([
            'state' => QuestionState::NotAnswered,
            'selected_option_id' => null,
        ]);

        $reflection = new \ReflectionClass(AttemptStateService::class);
        $method = $reflection->getMethod('computeTransition');
        $method->setAccessible(true);

        [$newState, $optionId] = $method->invoke($this->service, $answer, 'mark', null);

        $this->assertEquals(QuestionState::Marked, $newState);
    }

    public function test_mark_with_option_becomes_answered_marked()
    {
        $answer = new AttemptAnswer([
            'state' => QuestionState::Answered,
            'selected_option_id' => 42,
        ]);

        $reflection = new \ReflectionClass(AttemptStateService::class);
        $method = $reflection->getMethod('computeTransition');
        $method->setAccessible(true);

        [$newState, $optionId] = $method->invoke($this->service, $answer, 'mark', 42);

        $this->assertEquals(QuestionState::AnsweredMarked, $newState);
        $this->assertEquals(42, $optionId);
    }

    public function test_clear_answered_reverts_to_not_answered()
    {
        $answer = new AttemptAnswer([
            'state' => QuestionState::Answered,
            'selected_option_id' => 42,
        ]);

        $reflection = new \ReflectionClass(AttemptStateService::class);
        $method = $reflection->getMethod('computeTransition');
        $method->setAccessible(true);

        [$newState, $optionId] = $method->invoke($this->service, $answer, 'clear', null);

        $this->assertEquals(QuestionState::NotAnswered, $newState);
        $this->assertNull($optionId);
    }

    public function test_clear_answered_marked_reverts_to_marked()
    {
        $answer = new AttemptAnswer([
            'state' => QuestionState::AnsweredMarked,
            'selected_option_id' => 42,
        ]);

        $reflection = new \ReflectionClass(AttemptStateService::class);
        $method = $reflection->getMethod('computeTransition');
        $method->setAccessible(true);

        [$newState, $optionId] = $method->invoke($this->service, $answer, 'clear', null);

        $this->assertEquals(QuestionState::Marked, $newState);
        $this->assertNull($optionId);
    }
}

