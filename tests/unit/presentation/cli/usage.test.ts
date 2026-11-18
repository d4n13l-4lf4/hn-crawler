import { describe, expect, it, vi } from 'vitest';
import type { UsageRepositoryPort } from '@/application/ports/out/usage-repository.port';
import { AppliedFilters } from '@/domain/vo/applied-filters.vo';
import { Usage } from '@/domain/entities/usage.entity';
import { createUsageCommand } from '@/presentation/cli/usage';

describe('Usage command unit test', () => {
  it.each([
    {
      should: 'display an empty JSON array',
      records: [],
      expectedOutput: '[]',
    },
    {
      should: 'display usage entries with only their public fields',
      records: [
        new Usage(
          '018f0f4b-7b7c-7abc-8def-0123456789ab',
          123123123,
          AppliedFilters.builder()
            .sortBy('comments')
            .titleWords({ operator: 'gt', value: 5 })
            .build(),
          122
        ),
        new Usage(
          '018f0f4b-7b7c-7abc-8def-0123456789ac',
          123123124,
          AppliedFilters.builder().sortBy('points').build(),
          10
        ),
      ],
      expectedOutput: JSON.stringify(
        [
          {
            request_id: '018f0f4b-7b7c-7abc-8def-0123456789ab',
            request_timestamp: 123123123,
            applied_filters:
              'sort:number_of_comments:desc|sort:title_words:gt:5',
            duration_ms: 122,
          },
          {
            request_id: '018f0f4b-7b7c-7abc-8def-0123456789ac',
            request_timestamp: 123123124,
            applied_filters: 'sort:number_of_points:desc',
            duration_ms: 10,
          },
        ],
        null,
        2
      ),
    },
  ])(
    'should $should when the repository returns records',
    async ({ records, expectedOutput }) => {
      const getAll = vi.fn().mockReturnValue(records);
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      const log = vi.spyOn(console, 'log').mockImplementation(() => {});
      const repository: UsageRepositoryPort = { save: vi.fn(), getAll };
      const command = createUsageCommand(repository);

      await command.parseAsync(['node', 'hn-crawler', 'usage'], {
        from: 'user',
      });

      expect(log).toHaveBeenCalledOnce();
      expect(log).toHaveBeenCalledWith(expectedOutput);
      expect(getAll).toHaveBeenCalledOnce();
      expect(error).not.toHaveBeenCalled();
      vi.restoreAllMocks();
    }
  );

  it('should expose no feature-specific arguments or options', () => {
    const command = createUsageCommand({ save: vi.fn(), getAll: vi.fn() });

    expect(command.options).toHaveLength(0);
    expect(command.registeredArguments).toHaveLength(0);
  });

  it('should exit non-zero when reading usage history fails', async () => {
    const getAll = vi.fn().mockImplementation(() => {
      throw new Error('repository failed');
    });
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const previousExitCode = process.exitCode;
    const command = createUsageCommand({ save: vi.fn(), getAll });

    await command.parseAsync(['node', 'hn-crawler', 'usage'], { from: 'user' });

    expect(getAll).toHaveBeenCalledOnce();
    expect(error).toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
    process.exitCode = previousExitCode;
    vi.restoreAllMocks();
  });

  it('should reject unsupported arguments using the standard CLI error', async () => {
    const repository = { save: vi.fn(), getAll: vi.fn().mockReturnValue([]) };
    const command = createUsageCommand(repository);
    command.exitOverride();
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const exit = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process exit');
    }) as never);

    await expect(
      command.parseAsync(['node', 'hn-crawler', 'usage', '--unknown'], {
        from: 'user',
      })
    ).rejects.toThrow();

    expect(repository.getAll).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
    expect(exit).not.toHaveBeenCalled();
    expect(command.options).toHaveLength(0);
    vi.restoreAllMocks();
  });
});
