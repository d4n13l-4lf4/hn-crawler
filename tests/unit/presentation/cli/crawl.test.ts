import { describe, expect, it, vi } from 'vitest';
import { CrawlerPort } from '@/application/ports/in/crawler.port';
import { HNEntry } from '@/domain/entities/hn-entry.entity';
import { createCrawlCommand } from '@/presentation/cli/crawl';
import { config } from '@/config/config';

type CrawlCommandTestCase = {
  should: string;
  entries: HNEntry[];
  expectedOutput: string;
  args?: string[];
  expectedRequest?: {
    url: string;
    sortBy: 'comments' | 'points';
    titleWords?: { operator: 'gt' | 'le'; value: number };
  };
};

function createCrawler(entries: HNEntry[] = []): CrawlerPort {
  return { execute: vi.fn().mockResolvedValue(entries) };
}

describe('Crawl command unit test', () => {
  const testCases: CrawlCommandTestCase[] = [
    {
      should: 'display entries as a JSON array with the output fields',
      entries: [new HNEntry(1, 'My news', 1, 2)],
      expectedOutput:
        '[\n  {\n    "rank": 1,\n    "title": "My news",\n    "points": 1,\n    "number_of_comments": 2\n  }\n]',
      expectedRequest: {
        url: config.newsCombinatorUrl,
        sortBy: 'comments',
        titleWords: { operator: 'gt', value: 5 },
      },
    },
    {
      should: 'display an empty JSON array when there are no entries',
      entries: [],
      expectedOutput: '[]',
      expectedRequest: {
        url: config.newsCombinatorUrl,
        sortBy: 'comments',
        titleWords: { operator: 'gt', value: 5 },
      },
    },
    {
      should: 'apply the points ranking when requested',
      entries: [],
      expectedOutput: '[]',
      args: ['--top-points'],
      expectedRequest: {
        url: config.newsCombinatorUrl,
        sortBy: 'points',
        titleWords: { operator: 'gt', value: 5 },
      },
    },
    {
      should: 'apply the title filter and comments ranking when requested',
      entries: [],
      expectedOutput: '[]',
      args: ['--title-words', 'le:2'],
      expectedRequest: {
        url: config.newsCombinatorUrl,
        sortBy: 'comments',
        titleWords: { operator: 'le', value: 2 },
      },
    },
    {
      should: 'apply any filter and ranking combination',
      entries: [],
      expectedOutput: '[]',
      args: ['--title-words', 'gt:9', '--top-points'],
      expectedRequest: {
        url: config.newsCombinatorUrl,
        sortBy: 'points',
        titleWords: { operator: 'gt', value: 9 },
      },
    },
  ];

  it.each(testCases)(
    'should $should',
    async ({ entries, expectedOutput, args = [], expectedRequest }) => {
      const crawler = createCrawler(entries);
      const log = vi.spyOn(console, 'log').mockImplementation(() => {});
      const command = createCrawlCommand(crawler, true);

      await command.parseAsync(['node', 'hn-crawler', 'crawl', ...args], {
        from: 'user',
      });

      expect(log).toHaveBeenCalledWith(expectedOutput);
      expect(crawler.execute).toHaveBeenCalledOnce();
      expect(crawler.execute).toHaveBeenCalledWith(expectedRequest);
      log.mockRestore();
    }
  );

  it('should display the generic message and exit non-zero when crawling fails', async () => {
    const failure = new Error('HTTP 503: unavailable');
    const crawler = { execute: vi.fn().mockRejectedValue(failure) };
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const previousExitCode = process.exitCode;
    const command = createCrawlCommand(crawler, true);

    await command.parseAsync(['node', 'hn-crawler', 'crawl'], { from: 'user' });

    expect(error).toHaveBeenCalledWith(
      'An error occurred while running the crawler. Please try again.'
    );
    expect(process.exitCode).toBe(1);
    expect(crawler.execute).toHaveBeenCalledOnce();
    expect(crawler.execute).toHaveBeenCalledWith({
      url: config.newsCombinatorUrl,
      sortBy: 'comments',
      titleWords: { operator: 'gt', value: 5 },
    });
    process.exitCode = previousExitCode;
    error.mockRestore();
  });

  it.each([
    { should: 'expose the URL option in beta', beta: true, hasUrl: true },
    { should: 'omit the URL option in production', beta: false, hasUrl: false },
  ])('should $should', ({ beta, hasUrl }) => {
    const command = createCrawlCommand(createCrawler(), beta);
    expect(command.options.some((option) => option.long === '--url')).toBe(
      hasUrl
    );
  });

  it('should pass the beta URL to the crawler', async () => {
    const crawler = createCrawler();
    const command = createCrawlCommand(crawler, true);
    vi.spyOn(console, 'log').mockImplementation(() => {});

    await command.parseAsync(
      ['node', 'hn-crawler', 'crawl', '--url', 'http://127.0.0.1:4321'],
      { from: 'user' }
    );

    expect(crawler.execute).toHaveBeenCalledOnce();
    expect(crawler.execute).toHaveBeenCalledWith({
      url: 'http://127.0.0.1:4321',
      sortBy: 'comments',
      titleWords: { operator: 'gt', value: 5 },
    });
    vi.restoreAllMocks();
  });

  it('should pass the configured URL when the beta URL option is omitted', async () => {
    const crawler = createCrawler();
    const command = createCrawlCommand(crawler, true);
    vi.spyOn(console, 'log').mockImplementation(() => {});

    await command.parseAsync(['node', 'hn-crawler', 'crawl'], {
      from: 'user',
    });

    expect(crawler.execute).toHaveBeenCalledOnce();
    expect(crawler.execute).toHaveBeenCalledWith({
      url: config.newsCombinatorUrl,
      sortBy: 'comments',
      titleWords: { operator: 'gt', value: 5 },
    });
    vi.restoreAllMocks();
  });

  it('should serialize only the primitive value object fields', async () => {
    const crawler = createCrawler([new HNEntry(1, 'My news', 1, 2)]);
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const command = createCrawlCommand(crawler, true);

    await command.parseAsync(['node', 'hn-crawler', 'crawl'], {
      from: 'user',
    });

    const serialized = JSON.parse(log.mock.calls[0][0] as string);
    expect(serialized).toEqual([
      { rank: 1, title: 'My news', points: 1, number_of_comments: 2 },
    ]);
    expect(Object.keys(serialized[0])).toEqual([
      'rank',
      'title',
      'points',
      'number_of_comments',
    ]);
    vi.restoreAllMocks();
  });

  const invalidArgumentCases = [
    {
      should: 'reject both ranking options together',
      args: ['--top-comments', '--top-points'],
      expectedError: 'cannot be used together',
    },
    {
      should: 'reject a title limit below one',
      args: ['--title-words', 'gt:0'],
      expectedError: 'Invalid title words filter',
    },
    {
      should: 'reject an unsupported title comparator',
      args: ['--title-words', 'ge:5'],
      expectedError: 'Invalid title words filter',
    },
    {
      should: 'reject a non-integer title limit',
      args: ['--title-words', 'gt:abc'],
      expectedError: 'Invalid title words filter',
    },
    {
      should: 'show the friendly message for a title limit above 10000',
      args: ['--title-words', 'gt:10001'],
      expectedError:
        'The maximum value for the title words filter is 10000. Please use a value between 1 and 10000 (e.g., gt:100).',
    },
  ];

  it.each(invalidArgumentCases)(
    'should $should and exit non-zero',
    async ({ args, expectedError }) => {
      const crawler = createCrawler();
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      const previousExitCode = process.exitCode;
      const command = createCrawlCommand(crawler, true);

      await command.parseAsync(['node', 'hn-crawler', 'crawl', ...args], {
        from: 'user',
      });

      expect(error).toHaveBeenCalledWith(
        expect.stringContaining(expectedError)
      );
      expect(process.exitCode).toBe(1);
      expect(crawler.execute).not.toHaveBeenCalled();
      process.exitCode = previousExitCode;
      error.mockRestore();
    }
  );
});
