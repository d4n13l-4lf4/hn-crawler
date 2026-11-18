import { describe, expect, it } from 'vitest';
import { Usage } from '@/domain/entities/usage.entity';
import { AppliedFilters } from '@/domain/vo/applied-filters.vo';

type UsageTestCase = {
  should: string;
  when: string;
  requestId: string;
  timestamp: number;
  duration: number;
};

describe('Usage entity unit test', () => {
  const validFilters = AppliedFilters.builder().sortBy('comments').build();
  const testCases: UsageTestCase[] = [
    {
      should: 'store the usage properties',
      when: 'the record contains valid values',
      requestId: '018f0f4b-7b7c-7abc-8def-0123456789ab',
      timestamp: 123123123,
      duration: 122,
    },
    {
      should: 'allow a zero duration',
      when: 'the crawl completes within the same measured millisecond',
      requestId: '018f0f4b-7b7c-7abc-8def-0123456789ac',
      timestamp: 0,
      duration: 0,
    },
  ];

  it.each(testCases)('should $should when $when', (testCase) => {
    const usage = new Usage(
      testCase.requestId,
      testCase.timestamp,
      validFilters,
      testCase.duration
    );

    expect(usage).toMatchObject({
      request_id: testCase.requestId,
      request_timestamp: testCase.timestamp,
      applied_filters: validFilters,
      duration_ms: testCase.duration,
    });
  });

  it.each([
    {
      should: 'reject an invalid UUID',
      requestId: 'not-a-uuid',
      timestamp: 10,
      duration: 1,
    },
    {
      should: 'reject a non-v7 UUID',
      requestId: '018f0f4b-7b7c-4abc-8def-0123456789ab',
      timestamp: 10,
      duration: 1,
    },
    {
      should: 'reject an invalid request timestamp',
      requestId: '018f0f4b-7b7c-7abc-8def-0123456789ab',
      timestamp: -1,
      duration: 1,
    },
    {
      should: 'reject a fractional duration',
      requestId: '018f0f4b-7b7c-7abc-8def-0123456789ab',
      timestamp: 10,
      duration: 1.5,
    },
    {
      should: 'reject a negative duration',
      requestId: '018f0f4b-7b7c-7abc-8def-0123456789ab',
      timestamp: 10,
      duration: -1,
    },
  ])(
    'should $should when usage data is invalid',
    ({ requestId, timestamp, duration }) => {
      expect(
        () => new Usage(requestId, timestamp, validFilters, duration)
      ).toThrow();
    }
  );

  it('should reject an invalid applied-filters value when it is not built by the value object', () => {
    expect(
      () =>
        new Usage(
          '018f0f4b-7b7c-7abc-8def-0123456789ab',
          10,
          'sort:number_of_comments:desc' as unknown as AppliedFilters,
          1
        )
    ).toThrow('applied_filters must be an AppliedFilters value.');
  });
});
