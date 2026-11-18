import { describe, expect, it } from 'vitest';
import {
  createEntryFilter,
  countTitleWords,
} from '@/domain/policies/entry-filter.policy';
import { HNEntry } from '@/domain/entities/hn-entry.entity';

type CountTestCase = {
  should: string;
  title: string;
  expected: number;
};

describe('Entry Filter Policy Unit Test', () => {
  const countCases: CountTestCase[] = [
    { should: 'count spaced words', title: 'one two three', expected: 3 },
    {
      should: 'ignore punctuation-only tokens',
      title: 'This is - a self-explained example',
      expected: 5,
    },
    {
      should: 'count internal punctuation as part of a spaced word',
      title: 'state-of-the-art Java4Shell',
      expected: 2,
    },
    {
      should: 'count Unicode letters and digits',
      title: 'café 東京 42',
      expected: 3,
    },
    { should: 'return zero for whitespace', title: ' \t\n ', expected: 0 },
  ];

  it.each(countCases)('should $should in "$title"', ({ title, expected }) => {
    expect(countTitleWords(title)).toBe(expected);
  });

  const filterCases = [
    {
      should: 'keep entries above the word threshold',
      operator: 'gt' as const,
      title: 'one two three',
      limit: 2,
      expected: true,
    },
    {
      should: 'reject entries at the greater-than boundary',
      operator: 'gt' as const,
      title: 'one two',
      limit: 2,
      expected: false,
    },
    {
      should: 'keep entries at the less-than-or-equal boundary',
      operator: 'le' as const,
      title: 'one two',
      limit: 2,
      expected: true,
    },
    {
      should: 'reject entries above the less-than-or-equal boundary',
      operator: 'le' as const,
      title: 'one two three',
      limit: 2,
      expected: false,
    },
  ];

  it.each(filterCases)(
    'should $should',
    ({ operator, title, limit, expected }) => {
      const entry = new HNEntry(1, title, 0, 0);
      expect(createEntryFilter({ operator, value: limit })(entry)).toBe(
        expected
      );
    }
  );
});
