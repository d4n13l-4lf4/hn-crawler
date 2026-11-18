import { describe, expect, it } from 'vitest';
import { HNEntry } from '../../../../src/domain/entities/hn-entry.entity';

type HNEntryTestCase = {
  should: string;
  rank: number;
  title: string;
  points: number;
  comments: number;
};

describe('HNEntry Unit Test', () => {
  const testCases: HNEntryTestCase[] = [
    {
      should: 'store rank, title, points, and comment count',
      rank: 1,
      title: 'My news',
      points: 795,
      comments: 211,
    },
    {
      should: 'allow an empty title and zero counts',
      rank: 14,
      title: '',
      points: 0,
      comments: 0,
    },
  ];

  it.each(testCases)('should $should', ({ rank, title, points, comments }) => {
    const entry = new HNEntry(rank, title, points, comments);

    expect(entry).toEqual({
      rank,
      title,
      points,
      number_of_comments: comments,
    });
  });
});
