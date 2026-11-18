import { describe, expect, it, vi } from 'vitest';
import type { UsageRepositoryPort } from '@/application/ports/out/usage-repository.port';
import { UsageQueryUseCase } from '@/application/usecases/usage-query.usecase';
import { Usage } from '@/domain/entities/usage.entity';
import { AppliedFilters } from '@/domain/vo/applied-filters.vo';

describe('UsageQueryUseCase', () => {
  const records = [
    new Usage(
      '018f0f4b-7b7c-7abc-8def-0123456789ab',
      100,
      AppliedFilters.builder().sortBy('comments').build(),
      20
    ),
  ];

  const cases = [
    {
      should: 'return usage records from the repository',
      when: 'the repository has usage records',
      getAll: vi.fn().mockResolvedValue(records),
      expected: records,
    },
    {
      should: 'return an empty list from the repository',
      when: 'the repository has no usage records',
      getAll: vi.fn().mockResolvedValue([]),
      expected: [],
    },
  ];

  it.each(cases)('should $should when $when', async ({ getAll, expected }) => {
    const repository: UsageRepositoryPort = { save: vi.fn(), getAll };
    const useCase = new UsageQueryUseCase(repository);

    const result = await useCase.getAll();

    expect(result).toEqual(expected);
    expect(getAll).toHaveBeenCalledOnce();
    expect(getAll).toHaveBeenCalledWith();
  });

  it('should propagate repository errors when reading usage records', async () => {
    const failure = new Error('repository read failed');
    const getAll = vi.fn().mockRejectedValue(failure);
    const repository: UsageRepositoryPort = { save: vi.fn(), getAll };
    const useCase = new UsageQueryUseCase(repository);

    await expect(useCase.getAll()).rejects.toBe(failure);

    expect(getAll).toHaveBeenCalledOnce();
    expect(getAll).toHaveBeenCalledWith();
  });
});
