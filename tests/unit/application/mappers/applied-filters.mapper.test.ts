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
      should: 'map default comments ranking and title filter',
      when: 'the normalized request contains the command defaults',
      request: {
        url: 'https://example.test',
        sortBy: 'comments',
        titleWords: { operator: 'gt', value: 5 },
      },
      expected: 'sort:number_of_comments:desc,sort:title_words:gt:5',
    },
    {
      should: 'map points ranking without a title filter',
      when: 'the request ranks by points only',
      request: { url: 'https://example.test', sortBy: 'points' },
      expected: 'sort:number_of_points:desc',
    },
    {
      should: 'map a title filter with comments ranking',
      when: 'the request specifies only a title rule',
      request: {
        url: 'https://example.test',
        sortBy: 'comments',
        titleWords: { operator: 'le', value: 5 },
      },
      expected: 'sort:number_of_comments:desc,sort:title_words:le:5',
    },
    {
      should: 'preserve an explicit points and title combination',
      when: 'the request specifies both options',
      request: {
        url: 'https://example.test',
        sortBy: 'points',
        titleWords: { operator: 'gt', value: 12 },
      },
      expected: 'sort:number_of_points:desc,sort:title_words:gt:12',
    },
  ];

  it.each(testCases)('should $should when $when', ({ request, expected }) => {
    expect(mapAppliedFilters(request).toString()).toBe(expected);
  });
});
