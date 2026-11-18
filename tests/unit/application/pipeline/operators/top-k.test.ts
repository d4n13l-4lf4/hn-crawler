import { describe, expect, it } from 'vitest';
import { topK } from '@/application/pipeline/operators/top-k';
import { drain } from '../../../../helpers/async';

type Entry = { score: number; rank: number };
type TopKTestCase = {
  should: string;
  when: string;
  input: Entry[];
  k: number;
  expected: Entry[];
};

describe('Top K Operator Unit Test', () => {
  async function* from(values: Entry[]): AsyncGenerator<Entry> {
    yield* values;
  }

  const testCases: TopKTestCase[] = [
    {
      should: 'sort entries by score descending',
      when: 'the window includes all entries',
      input: [
        { score: 4, rank: 1 },
        { score: 9, rank: 2 },
        { score: 2, rank: 3 },
      ],
      k: 3,
      expected: [
        { score: 9, rank: 2 },
        { score: 4, rank: 1 },
        { score: 2, rank: 3 },
      ],
    },
    {
      should: 'return only the top k entries',
      when: 'the source has more entries than the window',
      input: [
        { score: 4, rank: 1 },
        { score: 9, rank: 2 },
        { score: 2, rank: 3 },
      ],
      k: 2,
      expected: [
        { score: 9, rank: 2 },
        { score: 4, rank: 1 },
      ],
    },
    {
      should: 'preserve input order for equal scores',
      when: 'scores tie',
      input: [
        { score: 5, rank: 2 },
        { score: 5, rank: 1 },
        { score: 1, rank: 3 },
      ],
      k: 3,
      expected: [
        { score: 5, rank: 2 },
        { score: 5, rank: 1 },
        { score: 1, rank: 3 },
      ],
    },
    {
      should: 'return an empty stream',
      when: 'the source is empty',
      input: [],
      k: 3,
      expected: [],
    },
    {
      should: 'return an empty stream',
      when: 'the window is zero',
      input: [{ score: 1, rank: 1 }],
      k: 0,
      expected: [],
    },
    {
      should: 'return an empty stream',
      when: 'the window is negative',
      input: [{ score: 1, rank: 1 }],
      k: -1,
      expected: [],
    },
  ];

  it.each(testCases)(
    'should $should when $when',
    async ({ input, k, expected }) => {
      const result = await drain(
        topK(k, (entry: Entry) => entry.score)(from(input))
      );
      expect(result).toEqual(expected);
      expect(result.length).toBeLessThanOrEqual(Math.max(0, Math.floor(k)));
    }
  );

  it('should propagate a source error', async () => {
    async function* broken(): AsyncGenerator<Entry> {
      yield { score: 1, rank: 1 };
      throw new Error('source failed');
    }

    await expect(
      drain(topK(2, (entry: Entry) => entry.score)(broken()))
    ).rejects.toThrow('source failed');
  });
});
