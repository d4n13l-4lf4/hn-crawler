import { describe, expect, it } from 'vitest';
import { filterTitleWords } from '@/application/pipeline/steps/filter-title-words.step';
import { HNEntry } from '@/domain/entities/hn-entry.entity';
import { drain } from '../../../../helpers/async';

type FilterStepTestCase = {
  should: string;
  operator: 'gt' | 'le';
  entries: HNEntry[];
  expectedRanks: number[];
};

describe('Filter Title Words Step Unit Test', () => {
  async function* from(entries: HNEntry[]): AsyncGenerator<HNEntry> {
    yield* entries;
  }

  const testCases: FilterStepTestCase[] = [
    {
      should: 'keep entries with more than two words',
      operator: 'gt',
      entries: [
        new HNEntry(1, 'one two three', 0, 0),
        new HNEntry(2, 'one two', 0, 0),
      ],
      expectedRanks: [1],
    },
    {
      should: 'keep entries with at most two words',
      operator: 'le',
      entries: [
        new HNEntry(1, 'one two three', 0, 0),
        new HNEntry(2, 'one two', 0, 0),
      ],
      expectedRanks: [2],
    },
    {
      should: 'return no entries when no title matches',
      operator: 'gt',
      entries: [new HNEntry(1, 'one', 0, 0)],
      expectedRanks: [],
    },
  ];

  it.each(testCases)(
    'should $should',
    async ({ operator, entries, expectedRanks }) => {
      const result = await drain(
        filterTitleWords({ operator, value: 2 })(from(entries))
      );
      expect(result.map((entry) => entry.rank.value)).toEqual(expectedRanks);
    }
  );
});
