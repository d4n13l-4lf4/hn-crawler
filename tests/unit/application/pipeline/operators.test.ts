import { describe, expect, it } from 'vitest';
import type { HnEntry } from '../../../../src/domain/models';
import {
  filterByWordCount,
  sortByComments,
  sortByPoints,
} from '../../../../src/application/pipeline/operators';

const entries: HnEntry[] = [
  { number: 1, title: 'one two', points: 4, comments: 9 },
  { number: 2, title: 'one two three', points: 12, comments: 2 },
  { number: 3, title: 'one', points: 8, comments: 6 },
];

describe('pipeline operators', () => {
  it('filters entries inclusively by word count', () => {
    expect(filterByWordCount(2, 2)(entries)).toEqual([entries[0]]);
  });

  it('sorts by points descending without mutating the input', () => {
    expect(sortByPoints(entries).map(({ number }) => number)).toEqual([
      2, 3, 1,
    ]);
    expect(entries.map(({ number }) => number)).toEqual([1, 2, 3]);
  });

  it('sorts by comments descending without mutating the input', () => {
    expect(sortByComments(entries).map(({ number }) => number)).toEqual([
      1, 3, 2,
    ]);
    expect(entries.map(({ number }) => number)).toEqual([1, 2, 3]);
  });
});
