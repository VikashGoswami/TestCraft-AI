<?php

namespace App\Services;

use App\Models\Option;
use App\Models\Question;
use App\Models\Test;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;

class QuestionImportService
{
    /**
     * Import questions from an uploaded CSV or XLSX file into the given test.
     *
     * Expected columns: question_text, option_a, option_b, option_c, option_d,
     *                   correct_option (a|b|c|d), topic (optional), difficulty (optional)
     *
     * @return array{imported: int, errors: string[]}
     */
    public function import(Test $test, UploadedFile $file): array
    {
        $extension = strtolower($file->getClientOriginalExtension());

        $rows = match ($extension) {
            'csv' => $this->parseCsv($file),
            'xlsx', 'xls' => $this->parseExcel($file),
            default => throw new \InvalidArgumentException('Unsupported file type. Use CSV or XLSX.'),
        };

        $imported = 0;
        $errors = [];
        $orderStart = (int) ($test->questions()->max('order_index') ?? 0);

        DB::transaction(function () use ($rows, $test, &$imported, &$errors, $orderStart) {
            foreach ($rows as $index => $row) {
                $rowNum = $index + 2; // 1-based index + header row
                try {
                    $this->importRow($test, $row, $orderStart + $imported + 1);
                    $imported++;
                } catch (\Throwable $e) {
                    $errors[] = "Row {$rowNum}: " . $e->getMessage();
                }
            }
        });

        return ['imported' => $imported, 'errors' => $errors];
    }

    private function importRow(Test $test, array $row, int $orderIndex): void
    {
        $questionText = trim($row['question_text'] ?? '');

        if (empty($questionText)) {
            throw new \InvalidArgumentException('question_text is required.');
        }

        $correctOption = strtolower(trim($row['correct_option'] ?? 'a'));
        $optionMap = ['a' => 'option_a', 'b' => 'option_b', 'c' => 'option_c', 'd' => 'option_d'];

        $difficulty = $row['difficulty'] ?? null;
        if (!in_array($difficulty, ['easy', 'medium', 'hard'], true)) {
            $difficulty = null;
        }

        // Parse marks (default 1.00 if missing or non-numeric)
        $marksRaw = trim($row['marks'] ?? '');
        $marks = is_numeric($marksRaw) && (float) $marksRaw > 0 ? (float) $marksRaw : 1.00;

        $question = Question::create([
            'test_id'       => $test->id,
            'question_text' => $questionText,
            'topic'         => trim($row['topic'] ?? 'General') ?: 'General',
            'difficulty'    => $difficulty,
            'order_index'   => $orderIndex,
            'marks'         => $marks,
        ]);

        $hasCorrect = false;

        foreach ($optionMap as $letter => $col) {
            $text = trim($row[$col] ?? '');
            if (empty($text)) {
                continue;
            }

            $isCorrect = $correctOption === $letter;
            if ($isCorrect) {
                $hasCorrect = true;
            }

            Option::create([
                'question_id' => $question->id,
                'option_text' => $text,
                'is_correct'  => $isCorrect,
            ]);
        }

        if (!$hasCorrect) {
            throw new \InvalidArgumentException(
                "No correct option found. 'correct_option' must be one of: a, b, c, d."
            );
        }
    }

    private function parseCsv(UploadedFile $file): array
    {
        $handle = fopen($file->getRealPath(), 'r');

        if ($handle === false) {
            throw new \RuntimeException('Failed to open CSV file.');
        }

        $headers = array_map('trim', fgetcsv($handle) ?: []);
        $rows = [];

        while (($data = fgetcsv($handle)) !== false) {
            if (count($data) !== count($headers)) {
                continue; // skip malformed rows silently
            }
            $rows[] = array_combine($headers, $data);
        }

        fclose($handle);

        return $rows;
    }

    private function parseExcel(UploadedFile $file): array
    {
        $data = Excel::toArray(new \stdClass(), $file);
        $sheet = $data[0] ?? [];

        if (empty($sheet)) {
            return [];
        }

        $headers = array_map('trim', (array) ($sheet[0] ?? []));
        $rows = [];

        foreach (array_slice($sheet, 1) as $row) {
            $row = (array) $row;
            if (count($row) !== count($headers)) {
                continue;
            }
            $rows[] = array_combine($headers, $row);
        }

        return $rows;
    }
}

