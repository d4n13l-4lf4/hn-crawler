import { describe, expect, it } from 'vitest';
import { Usage } from '@/domain/entities/usage.entity';
import { AppliedFilters } from '@/domain/vo/applied-filters.vo';
import { InMemoryUsageRepository } from '@/infrastructure/persistence/in-memory/in-memory.repository';

type InMemoryUsageRepositoryTestCase = {
  should: string;
  when: string;
  create: () => Usage[];
  expectedCount: number;
};

describe('InMemoryUsageRepository unit test', () => {
  const filters = AppliedFilters.builder().sortBy('comments').build();
  const first = new Usage(
    '018f0f4b-7b7c-7abc-8def-0123456789ab',
    100,
    filters,
    10
  );
  const second = new Usage(
    '018f0f4b-7b7c-7abc-8def-0123456789ac',
    200,
    filters,
    20
  );

  const testCases: InMemoryUsageRepositoryTestCase[] = [
    {
      should: 'return no records',
      when: 'nothing has been saved',
      create: () => [],
      expectedCount: 0,
    },
    {
      should: 'return the saved record',
      when: 'one record has been saved',
      create: () => [first],
      expectedCount: 1,
    },
    {
      should: 'return records in insertion order',
      when: 'multiple records have been saved',
      create: () => [first, second],
      expectedCount: 2,
    },
  ];

  it.each(testCases)(
    'should $should when $when',
    async ({ create, expectedCount }) => {
      const repository = new InMemoryUsageRepository();
      const records = create();
      for (const record of records) await repository.save(record);

      const result = await repository.getAll();

      expect(result).toEqual(records);
      expect(result).toHaveLength(expectedCount);
    }
  );

  it('should return a defensive list copy when history is read', async () => {
    const repository = new InMemoryUsageRepository();
    await repository.save(first);

    const result = await repository.getAll();
    result.length = 0;

    expect(await repository.getAll()).toEqual([first]);
  });
});
