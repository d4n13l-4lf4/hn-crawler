import { describe, expect, it } from 'vitest';
import { countWords } from '../../../src/domain/text-utils';

describe('countWords', () => {
  it.each([
    ['', 0],
    ['   \t\n ', 0],
    ['one', 1],
    ['one two\tthree', 3],
  ])('counts words in %j', (text, expected) => {
    expect(countWords(text)).toBe(expected);
  });
});
