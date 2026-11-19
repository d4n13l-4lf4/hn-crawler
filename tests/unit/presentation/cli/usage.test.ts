import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { UsageQueryPort } from '@/application/ports/in/usage-query.port';
import { AppliedFilters } from '@/domain/vo/applied-filters.vo';
import { Usage } from '@/domain/entities/usage.entity';
import { createUsageCommand } from '@/presentation/cli/usage';

const UUID = '018f0f4b-7b7c-7abc-8def-0123456789ab';
const FILTERS = AppliedFilters.builder()
  .sortBy('comments')
  .titleWords({ operator: 'gt', value: 5 })
  .build();
const NO_FILTERS = AppliedFilters.builder().build();

const ORIGINAL_TIME_ZONE = process.env.TZ;

beforeEach(() => {
  process.env.TZ = 'UTC';
});

afterEach(() => {
  if (ORIGINAL_TIME_ZONE === undefined) {
    delete process.env.TZ;
  } else {
    process.env.TZ = ORIGINAL_TIME_ZONE;
  }
  vi.restoreAllMocks();
});

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
        'ID | Request Date and Time | Applied Filters | Duration (ms)',
        '---|-----------------------|-----------------|--------------',
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
        makeUsage(
          '018f0f4b-7b7c-7abc-8def-0123456789ad',
          123123125,
          NO_FILTERS,
          8
        ),
      ],
      expectedOutput: [
        'Usage data',
        'ID                                   | Request Date and Time     | Applied Filters                                      | Duration (ms)',
        '-------------------------------------|---------------------------|------------------------------------------------------|--------------',
        `${UUID} | 1970-01-02 10:12:03 (UTC) | sort:number_of_comments:desc,filter:title_words:gt:5 |           122`,
        '018f0f4b-7b7c-7abc-8def-0123456789ac | 1970-01-02 10:12:03 (UTC) | sort:number_of_points:desc                           |            10',
        '018f0f4b-7b7c-7abc-8def-0123456789ad | 1970-01-02 10:12:03 (UTC) | none                                                 |             8',
      ].join('\n'),
    },
  ])(
    'should $should when the repository returns records',
    async ({ records, expectedOutput }) => {
      const getAll = vi.fn().mockReturnValue(records);
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      const log = vi.spyOn(console, 'log').mockImplementation(() => {});
      const usageQuery: UsageQueryPort = { getAll };
      const command = createUsageCommand(usageQuery);

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
      should: 'render UTC timestamps with the UTC timezone label',
      timezone: 'UTC',
      timestamp: Date.UTC(2026, 10, 18, 21, 13),
      expected: '2026-11-18 21:13:00 (UTC)',
    },
    {
      should:
        'render local time and use a numeric offset when the timezone has no abbreviation',
      timezone: 'Asia/Kathmandu',
      timestamp: Date.UTC(2026, 10, 18, 21, 13),
      expected: '2026-11-19 02:58:00 (GMT+5:45)',
    },
    {
      should: 'render local wall-clock time and abbreviation',
      timezone: 'Europe/Madrid',
      timestamp: Date.UTC(2026, 10, 18, 21, 13),
      expected: '2026-11-18 22:13:00 (CET)',
    },
    {
      should: 'apply the timezone abbreviation for the timestamp instant',
      timezone: 'Europe/Madrid',
      timestamp: Date.UTC(2026, 6, 18, 19, 13),
      expected: '2026-07-18 21:13:00 (CEST)',
    },
    {
      should: 'use UTC when the system timezone has a generic label',
      timezone: 'Etc/GMT',
      timestamp: Date.UTC(2026, 10, 18, 21, 13),
      expected: '2026-11-18 21:13:00 (UTC)',
    },
  ])(
    'should $should when formatting a stored timestamp',
    async ({ timezone, timestamp, expected }) => {
      process.env.TZ = timezone;
      const log = vi.spyOn(console, 'log').mockImplementation(() => {});
      const command = createUsageCommand({
        getAll: vi
          .fn()
          .mockReturnValue([makeUsage(UUID, timestamp, FILTERS, 122)]),
      });

      await command.parseAsync(['node', 'hn-crawler', 'usage'], {
        from: 'user',
      });

      expect(log).toHaveBeenCalledOnce();
      expect(log.mock.calls[0][0]).toContain(expected);
    }
  );

  it('should fall back to UTC when the system timezone is unavailable', async () => {
    process.env.TZ = 'Invalid/Unknown';
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const command = createUsageCommand({
      getAll: vi
        .fn()
        .mockReturnValue([
          makeUsage(UUID, Date.UTC(2026, 10, 18, 21, 13), FILTERS, 122),
        ]),
    });

    await command.parseAsync(['node', 'hn-crawler', 'usage'], { from: 'user' });

    expect(log).toHaveBeenCalledOnce();
    expect(log.mock.calls[0][0]).toContain('2026-11-18 21:13:00 (GMT+0)');
  });

  it.each([
    {
      should:
        'fall back to UTC when the timestamp is outside the supported date range',
      timestamp: Number.MAX_SAFE_INTEGER,
    },
  ])('should $should when formatting fails', async ({ timestamp }) => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const command = createUsageCommand({
      getAll: vi
        .fn()
        .mockReturnValue([makeUsage(UUID, timestamp, FILTERS, 122)]),
    });
    const previousExitCode = process.exitCode;

    await command.parseAsync(['node', 'hn-crawler', 'usage'], { from: 'user' });

    expect(error).toHaveBeenCalledOnce();
    expect(error).toHaveBeenCalledWith(
      'An error occurred while retrieving usage statistics.'
    );
    expect(process.exitCode).toBe(1);
    process.exitCode = previousExitCode;
  });

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
      const getAll = vi.fn().mockReturnValue([record]);
      const command = createUsageCommand({ getAll });

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
    const command = createUsageCommand({ getAll: vi.fn() });

    expect(command.options).toHaveLength(0);
    expect(command.registeredArguments).toHaveLength(0);
  });

  it('should exit non-zero when reading usage history fails', async () => {
    const getAll = vi.fn().mockImplementation(() => {
      throw new Error('repository failed');
    });
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const previousExitCode = process.exitCode;
    const command = createUsageCommand({ getAll });

    await command.parseAsync(['node', 'hn-crawler', 'usage'], { from: 'user' });

    expect(getAll).toHaveBeenCalledOnce();
    expect(error).toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
    process.exitCode = previousExitCode;
    vi.restoreAllMocks();
  });

  it('should reject unsupported arguments using the standard CLI error', async () => {
    const usageQuery = { getAll: vi.fn().mockReturnValue([]) };
    const command = createUsageCommand(usageQuery);
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

    expect(usageQuery.getAll).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
    expect(exit).not.toHaveBeenCalled();
    expect(command.options).toHaveLength(0);
    vi.restoreAllMocks();
  });
});
