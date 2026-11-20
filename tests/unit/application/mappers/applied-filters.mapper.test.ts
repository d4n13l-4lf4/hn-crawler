import { describe, expect, it } from 'vitest';
import { mapAppliedFilters } from '@/application/mappers/applied-filters.mapper';
import type { CrawlRequest } from '@/application/ports/in/crawler.port';

type AppliedFiltersMapperTestCase = {
  should: string;
  when: string;
  request: CrawlRequest;
  expected: string;
};

describe('AppliedFilters mapper unit test', () => {
  const testCases: AppliedFiltersMapperTestCase[] = [
    {
      should: 'map comments ranking and title filtering',
      when: 'the request explicitly selects both operations',
      request: {
        maxEntries: 30,
        sortBy: 'comments',
        titleWords: { operator: 'gt', value: 5 },
      },
      expected: 'sort:number_of_comments:desc,filter:title_words:gt:5',
    },
    {
      should: 'map points ranking without a title filter',
      when: 'the request ranks by points only',
      request: { maxEntries: 30, sortBy: 'points' },
      expected: 'sort:number_of_points:desc',
    },
    {
      should: 'map only a title filter',
      when: 'the request has no ranking choice',
      request: {
        maxEntries: 30,
        titleWords: { operator: 'le', value: 5 },
      },
      expected: 'filter:title_words:le:5',
    },
    {
      should: 'preserve an explicit points and title combination',
      when: 'the request specifies both options',
      request: {
        maxEntries: 30,
        sortBy: 'points',
        titleWords: { operator: 'gt', value: 12 },
      },
      expected: 'sort:number_of_points:desc,filter:title_words:gt:12',
    },
    {
      should: 'map no selected operations to none',
      when: 'the request includes only its source URL',
      request: { maxEntries: 30 },
      expected: 'none',
    },
  ];

  it.each(testCases)('should $should when $when', ({ request, expected }) => {
    expect(mapAppliedFilters(request).toString()).toBe(expected);
  });
});
