import { describe, expect, it } from 'vitest';
import { Numeric } from '@/domain/vo/numeric';

type NumericTestCase = {
  should: string;
  rawValue: unknown;
  expectedValue: number;
};

describe('Numeric value object unit test', () => {
  const testCases: NumericTestCase[] = [
    { should: 'preserve an integer', rawValue: 12, expectedValue: 12 },
    {
      should: 'parse a digit sequence from text',
      rawValue: '795 points',
      expectedValue: 795,
    },
    {
      should: 'parse a digit sequence after text',
      rawValue: '  211 comments',
      expectedValue: 211,
    },
    {
      should: 'use the first digit sequence',
      rawValue: '12 points, 3 bonus',
      expectedValue: 12,
    },
    { should: 'default a negative number', rawValue: -4, expectedValue: 0 },
    {
      should: 'default an unmatched value',
      rawValue: 'no score',
      expectedValue: 0,
    },
    {
      should: 'default a missing value',
      rawValue: undefined,
      expectedValue: 0,
    },
    { should: 'default NaN', rawValue: Number.NaN, expectedValue: 0 },
    {
      should: 'default infinity',
      rawValue: Number.POSITIVE_INFINITY,
      expectedValue: 0,
    },
    { should: 'default a non-numeric value', rawValue: {}, expectedValue: 0 },
  ];

  it.each(testCases)('should $should', ({ rawValue, expectedValue }) => {
    expect(new Numeric(rawValue).value).toBe(expectedValue);
  });
});
