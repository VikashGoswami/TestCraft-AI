<?php

namespace App\Services;

use App\Enums\QuestionState;
use App\Models\AttemptAnswer;
use InvalidArgumentException;

class AttemptStateService
{
    /**
     * Transition an answer's state based on a user action.
     *
     * Actions:
     *  - 'visit'  → mark as seen (not_visited → not_answered); no-op if already visited
     *  - 'save'   → record the selected option; sets Answered or AnsweredMarked
     *  - 'mark'   → flag for review; sets Marked or AnsweredMarked depending on option
     *  - 'clear'  → remove the selected option; steps back one level
     */
    public function transition(AttemptAnswer $answer, string $action, ?int $optionId): AttemptAnswer
    {
        [$newState, $newOptionId] = $this->computeTransition($answer, $action, $optionId);

        $answer->update([
            'state' => $newState,
            'selected_option_id' => $newOptionId,
        ]);

        return $answer->fresh();
    }

    private function computeTransition(AttemptAnswer $answer, string $action, ?int $optionId): array
    {
        $state = $answer->state;
        $existingOptionId = $answer->selected_option_id;

        return match ($action) {
            'visit' => [
                $state === QuestionState::NotVisited ? QuestionState::NotAnswered : $state,
                $existingOptionId,
            ],

            'save' => [
                $optionId !== null
                    ? (in_array($state, [QuestionState::Marked, QuestionState::AnsweredMarked])
                        ? QuestionState::AnsweredMarked
                        : QuestionState::Answered)
                    : QuestionState::NotAnswered,
                $optionId,
            ],

            'mark' => [
                ($optionId !== null || in_array($state, [QuestionState::Answered, QuestionState::AnsweredMarked]))
                    ? QuestionState::AnsweredMarked
                    : QuestionState::Marked,
                $optionId ?? $existingOptionId,
            ],

            'clear' => match ($state) {
                QuestionState::Answered => [QuestionState::NotAnswered, null],
                QuestionState::AnsweredMarked => [QuestionState::Marked, null],
                default => [
                    $state === QuestionState::NotVisited ? QuestionState::NotAnswered : $state,
                    null,
                ],
            },

            default => throw new InvalidArgumentException("Unknown action: {$action}"),
        };
    }
}

