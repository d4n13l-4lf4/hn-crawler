import { describe, expect, it } from 'vitest';
import { Title } from '@/domain/vo/title';

type TitleTestCase = {
  should: string;
  rawValue: unknown;
  expectedValue: string;
};

describe('Title value object unit test', () => {
  const testCases: TitleTestCase[] = [
    {
      should: 'normalize whitespace in the supplied title',
      rawValue: '  My news  ',
      expectedValue: 'My news',
    },
    {
      should: 'collapse internal whitespace',
      rawValue: 'My\n  news',
      expectedValue: 'My news',
    },
    { should: 'default an empty title', rawValue: '', expectedValue: '' },
    {
      should: 'default a missing title',
      rawValue: undefined,
      expectedValue: '',
    },
    { should: 'default a non-string title', rawValue: 42, expectedValue: '' },
  ];

  it.each(testCases)('should $should', ({ rawValue, expectedValue }) => {
    expect(new Title(rawValue).value).toBe(expectedValue);
  });
});
