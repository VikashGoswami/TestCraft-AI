<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\AiReportService;

class AiReportServiceTest extends TestCase
{
    private AiReportService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new AiReportService();
    }

    public function test_fallback_generates_valid_schema()
    {
        $reflection = new \ReflectionClass(AiReportService::class);
        $method = $reflection->getMethod('generateFallback');
        $method->setAccessible(true);

        $topics = [
            ['topic' => 'Algebra', 'correct' => 1, 'total' => 5, 'percentage' => 20],
            ['topic' => 'Geometry', 'correct' => 4, 'total' => 5, 'percentage' => 80],
            ['topic' => 'Calculus', 'correct' => 5, 'total' => 5, 'percentage' => 100],
        ];

        $result = $method->invoke($this->service, $topics, 66);

        $this->assertArrayHasKey('strong_topics', $result);
        $this->assertArrayHasKey('weak_topics', $result);
        $this->assertArrayHasKey('summary', $result);
        $this->assertArrayHasKey('topic_advice', $result);

        $this->assertContains('Algebra', $result['weak_topics']);
        $this->assertContains('Geometry', $result['strong_topics']);
        $this->assertContains('Calculus', $result['strong_topics']);
        $this->assertStringContainsString('66%', $result['summary']);
        $this->assertCount(1, $result['topic_advice']);
        $this->assertEquals('Algebra', $result['topic_advice'][0]['topic']);
    }

    public function test_validate_schema_accepts_valid_payload()
    {
        $reflection = new \ReflectionClass(AiReportService::class);
        $method = $reflection->getMethod('validateSchema');
        $method->setAccessible(true);

        $validPayload = [
            'strong_topics' => ['Reading Comprehension'],
            'weak_topics' => ['Geometry'],
            'summary' => 'You did well overall.',
            'topic_advice' => [
                ['topic' => 'Geometry', 'advice' => 'Review shape angles.'],
            ],
        ];

        $this->assertTrue($method->invoke($this->service, $validPayload));
    }

    public function test_validate_schema_rejects_missing_fields()
    {
        $reflection = new \ReflectionClass(AiReportService::class);
        $method = $reflection->getMethod('validateSchema');
        $method->setAccessible(true);

        $invalidPayload = [
            'strong_topics' => ['Reading Comprehension'],
            // missing weak_topics, summary, topic_advice
        ];

        $this->assertFalse($method->invoke($this->service, $invalidPayload));
    }
}

