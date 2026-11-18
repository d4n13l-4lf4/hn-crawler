import { describe, expect, it } from 'vitest';
import { Numeric } from '@/domain/vo/numeric';

type NumericTestCase = {
  should: string;
  when: string;
  input: unknown;
  expected: number;
};

describe('Numeric value object unit test', () => {
  const testCases: NumericTestCase[] = [
    {
      should: 'preserve an integer',
      when: 'the raw value is a non-negative number',
      input: 12,
      expected: 12,
    },
    {
      should: 'parse a digit sequence from text',
      when: 'the raw value contains a points count',
      input: '795 points',
      expected: 795,
    },
    {
      should: 'parse a digit sequence after text',
      when: 'the raw value contains a comments count',
      input: '  211 comments',
      expected: 211,
    },
    {
      should: 'use the first digit sequence',
      when: 'the raw text contains more than one digit sequence',
      input: '12 points, 3 bonus',
      expected: 12,
    },
    {
      should: 'default to zero',
      when: 'the raw number is negative',
      input: -4,
      expected: 0,
    },
    {
      should: 'default to zero',
      when: 'the raw text contains no digits',
      input: 'no score',
      expected: 0,
    },
    {
      should: 'default to zero',
      when: 'the raw value is missing',
      input: undefined,
      expected: 0,
    },
    {
      should: 'default to zero',
      when: 'the raw number is NaN',
      input: Number.NaN,
      expected: 0,
    },
    {
      should: 'default to zero',
      when: 'the raw number is infinite',
      input: Number.POSITIVE_INFINITY,
      expected: 0,
    },
    {
      should: 'default to zero',
      when: 'the raw value is not a number or string',
      input: {},
      expected: 0,
    },
  ];

  it.each(testCases)('should $should when $when', ({ input, expected }) => {
    expect(new Numeric(input).value).toBe(expected);
  });
});
