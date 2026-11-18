import { describe, expect, it, vi } from 'vitest';
import type { UsageRepositoryPort } from '@/application/ports/out/usage-repository.port';
import { AppliedFilters } from '@/domain/vo/applied-filters.vo';
import { Usage } from '@/domain/entities/usage.entity';
import { createUsageCommand } from '@/presentation/cli/usage';

const UUID = '018f0f4b-7b7c-7abc-8def-0123456789ab';
const FILTERS = AppliedFilters.builder()
  .sortBy('comments')
  .titleWords({ operator: 'gt', value: 5 })
  .build();

function makeUsage(
  requestId: string,
  timestamp: number,
  filters: AppliedFilters,
  duration: number
): Usage {
  return new Usage(requestId, timestamp, filters, duration);
}

describe('Usage command unit test', () => {
  it.each([
    {
      should: 'display the table headers and separator for empty history',
      records: [],
      expectedOutput: [
        'Usage data',
        'ID | Request Timestamp | Applied Filters | Duration (ms)',
        '---|-------------------|-----------------|--------------',
      ].join('\n'),
    },
    {
      should: 'display aligned rows and retain the specified column order',
      records: [
        makeUsage(UUID, 123123123, FILTERS, 122),
        makeUsage(
          '018f0f4b-7b7c-7abc-8def-0123456789ac',
          123123124,
          AppliedFilters.builder().sortBy('points').build(),
          10
        ),
      ],
      expectedOutput: [
        'Usage data',
        'ID                                   | Request Timestamp | Applied Filters                                     | Duration (ms)',
        '-------------------------------------|-------------------|-----------------------------------------------------|--------------',
        `${UUID} |         123123123 | sort:number_of_comments:desc\\|sort:title_words:gt:5 |           122`,
        '018f0f4b-7b7c-7abc-8def-0123456789ac |         123123124 | sort:number_of_points:desc                          |            10',
      ].join('\n'),
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
      const output = log.mock.calls[0][0] as string;
      const tableRows = output.split('\n').slice(1);
      expect(new Set(tableRows.map((row) => row.length)).size).toBe(1);
      expect(getAll).toHaveBeenCalledOnce();
      expect(error).not.toHaveBeenCalled();
      vi.restoreAllMocks();
    }
  );

  it.each([
    {
      should: 'escape embedded column delimiters',
      filters: AppliedFilters.fromString('sort|points'),
      expected: 'sort\\|points',
    },
    {
      should: 'render line breaks visibly on a single row',
      filters: AppliedFilters.fromString('sort\npoints\rnext'),
      expected: 'sort\\npoints\\rnext',
    },
  ])(
    'should $should when formatting filter values',
    async ({ filters, expected }) => {
      const record = makeUsage(UUID, 1, filters, 2);
      const log = vi.spyOn(console, 'log').mockImplementation(() => {});
      const command = createUsageCommand({
        save: vi.fn(),
        getAll: () => [record],
      });

      await command.parseAsync(['node', 'hn-crawler', 'usage'], {
        from: 'user',
      });

      expect(log).toHaveBeenCalledOnce();
      expect(log.mock.calls[0][0]).toContain(expected);
      expect(log.mock.calls[0][0]).not.toContain('\npoints');
      log.mockRestore();
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
