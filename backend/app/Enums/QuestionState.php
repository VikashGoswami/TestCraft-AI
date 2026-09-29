<?php

namespace App\Enums;

enum QuestionState: string
{
    case NotVisited = 'not_visited';
    case NotAnswered = 'not_answered';
    case Answered = 'answered';
    case Marked = 'marked';
    case AnsweredMarked = 'answered_marked';
}

