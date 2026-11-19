import { describe, expect, it } from 'vitest';
import { AppliedFilters } from '@/domain/vo/applied-filters.vo';

type AppliedFiltersTestCase = {
  should: string;
  when: string;
  sortBy?: 'comments' | 'points';
  titleWords?: { operator: 'gt' | 'le'; value: number };
  expected: string;
};

describe('AppliedFilters value object unit test', () => {
  const testCases: AppliedFiltersTestCase[] = [
    {
      should: 'map comment ranking to its stable label',
      when: 'only comment sorting is applied',
      sortBy: 'comments',
      expected: 'sort:number_of_comments:desc',
    },
    {
      should: 'map points ranking to its stable label',
      when: 'only points sorting is applied',
      sortBy: 'points',
      expected: 'sort:number_of_points:desc',
    },
    {
      should:
        'map comment ranking to its stable label through optional choices',
      when: 'comments are provided to the optional choices factory',
      sortBy: 'comments',
      expected: 'sort:number_of_comments:desc',
    },
    {
      should: 'omit a title label',
      when: 'no title filter is applied',
      sortBy: 'points',
      expected: 'sort:number_of_points:desc',
    },
    {
      should: 'append a greater-than title rule after sorting',
      when: 'a gt title rule is applied',
      sortBy: 'comments',
      titleWords: { operator: 'gt', value: 5 },
      expected: 'sort:number_of_comments:desc,filter:title_words:gt:5',
    },
    {
      should: 'append a less-than-or-equal title rule after sorting',
      when: 'a le title rule is applied',
      sortBy: 'points',
      titleWords: { operator: 'le', value: 5 },
      expected: 'sort:number_of_points:desc,filter:title_words:le:5',
    },
    {
      should: 'represent the absence of selected operations',
      when: 'neither ranking nor title filtering is applied',
      expected: 'none',
    },
    {
      should: 'describe a title rule without adding a ranking label',
      when: 'only title filtering is applied',
      titleWords: { operator: 'le', value: 5 },
      expected: 'filter:title_words:le:5',
    },
  ];

  it.each(testCases)('should $should when $when', (testCase) => {
    const builder = AppliedFilters.builder();
    if (testCase.sortBy) builder.sortBy(testCase.sortBy);
    const filters = builder.titleWords(testCase.titleWords).build();

    expect(filters.toString()).toBe(testCase.expected);
  });

  it('should restore the persisted applied filter text', () => {
    const persistedFilters =
      'sort:number_of_comments:desc,sort:title_words:gt:5';

    expect(AppliedFilters.fromString(persistedFilters).toString()).toBe(
      persistedFilters
    );
  });
});
