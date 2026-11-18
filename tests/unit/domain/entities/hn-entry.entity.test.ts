import { describe, expect, it } from 'vitest';
import { HNEntry } from '@/domain/entities/hn-entry.entity';
import { Numeric } from '@/domain/vo/numeric';
import { Title } from '@/domain/vo/title';

type HNEntryTestCase = {
  should: string;
  when: string;
  input: {
    rank: number;
    title: string;
    points: number;
    comments: number;
  };
  expected: {
    rank: number;
    title: string;
    points: number;
    number_of_comments: number;
  };
};

describe('HNEntry Unit Test', () => {
  const testCases: HNEntryTestCase[] = [
    {
      should: 'store rank, title, points, and comment count',
      when: 'the entry has the first Hacker News story values',
      input: { rank: 1, title: 'My news', points: 795, comments: 211 },
      expected: {
        rank: 1,
        title: 'My news',
        points: 795,
        number_of_comments: 211,
      },
    },
    {
      should: 'allow an empty title and zero counts',
      when: 'the entry has missing title and count values',
      input: { rank: 14, title: '', points: 0, comments: 0 },
      expected: {
        rank: 14,
        title: '',
        points: 0,
        number_of_comments: 0,
      },
    },
  ];

  it.each(testCases)('should $should when $when', ({ input, expected }) => {
    const entry = new HNEntry(
      input.rank,
      input.title,
      input.points,
      input.comments
    );

    expect(entry.rank).toBeInstanceOf(Numeric);
    expect(entry.title).toBeInstanceOf(Title);
    expect(entry.points).toBeInstanceOf(Numeric);
    expect(entry.number_of_comments).toBeInstanceOf(Numeric);
    expect({
      rank: entry.rank.value,
      title: entry.title.value,
      points: entry.points.value,
      number_of_comments: entry.number_of_comments.value,
    }).toEqual(expected);
  });
});
