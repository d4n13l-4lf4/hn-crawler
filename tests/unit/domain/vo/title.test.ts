import { describe, expect, it } from 'vitest';
import { Title } from '@/domain/vo/title';

type TitleTestCase = {
  should: string;
  when: string;
  input: unknown;
  expected: string;
};

describe('Title value object unit test', () => {
  const testCases: TitleTestCase[] = [
    {
      should: 'normalize whitespace in the supplied title',
      when: 'the raw title contains leading and trailing whitespace',
      input: '  My news  ',
      expected: 'My news',
    },
    {
      should: 'collapse internal whitespace',
      when: 'the raw title contains repeated whitespace',
      input: 'My\n  news',
      expected: 'My news',
    },
    {
      should: 'return an empty title',
      when: 'the raw title is empty',
      input: '',
      expected: '',
    },
    {
      should: 'default a missing title',
      when: 'the raw title is missing',
      input: undefined,
      expected: '',
    },
    {
      should: 'default a non-string title',
      when: 'the raw title is not a string',
      input: 42,
      expected: '',
    },
  ];

  it.each(testCases)('should $should when $when', ({ input, expected }) => {
    expect(new Title(input).value).toBe(expected);
  });
});
