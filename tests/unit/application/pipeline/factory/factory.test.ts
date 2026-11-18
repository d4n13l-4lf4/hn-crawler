import { describe, expect, it } from 'vitest';
import { createPipeline } from '@/application/pipeline/factory/factory';
import { HNEntry } from '@/domain/entities/hn-entry.entity';
import { drain } from '../../../../helpers/async';

type PipelineTestCase = {
  should: string;
  sortBy: 'comments' | 'points';
  titleWords?: { operator: 'gt' | 'le'; value: number };
  entries: HNEntry[];
  expectedRanks: number[];
};

describe('Pipeline Factory Unit Test', () => {
  async function* from(entries: HNEntry[]): AsyncGenerator<HNEntry> {
    yield* entries;
  }

  const entries = [
    new HNEntry(1, 'one two three', 10, 2),
    new HNEntry(2, 'one two', 20, 9),
    new HNEntry(3, 'one two four', 20, 9),
    new HNEntry(4, 'one', 0, 0),
  ];

  const testCases: PipelineTestCase[] = [
    {
      should: 'filter long titles and rank by comments',
      sortBy: 'comments',
      titleWords: { operator: 'gt', value: 2 },
      entries,
      expectedRanks: [3, 1],
    },
    {
      should: 'filter short titles and rank by comments',
      sortBy: 'comments',
      titleWords: { operator: 'le', value: 2 },
      entries,
      expectedRanks: [2, 4],
    },
    {
      should: 'filter long titles and rank by points',
      sortBy: 'points',
      titleWords: { operator: 'gt', value: 2 },
      entries,
      expectedRanks: [3, 1],
    },
    {
      should: 'filter short titles and rank by points',
      sortBy: 'points',
      titleWords: { operator: 'le', value: 2 },
      entries,
      expectedRanks: [2, 4],
    },
    {
      should: 'rank all candidates by comments when no title rule is set',
      sortBy: 'comments',
      entries,
      expectedRanks: [2, 3, 1, 4],
    },
    {
      should: 'rank all candidates by points when no title rule is set',
      sortBy: 'points',
      entries,
      expectedRanks: [2, 3, 1, 4],
    },
    {
      should: 'return no entries for a filter with no matches',
      sortBy: 'comments',
      titleWords: { operator: 'gt', value: 10000 },
      entries,
      expectedRanks: [],
    },
  ];

  it.each(testCases)('should $should', async (testCase) => {
    const result = await drain(
      createPipeline({
        sortBy: testCase.sortBy,
        titleWords: testCase.titleWords,
      })(from(testCase.entries))
    );
    expect(result.map((entry) => entry.rank.value)).toEqual(
      testCase.expectedRanks
    );
  });
});
