import { describe, expect, it, vi } from 'vitest';
import { CrawlerPort } from '@/application/ports/in/crawler.port';
import { HNEntry } from '@/domain/entities/hn-entry.entity';
import { createCrawlCommand } from '@/presentation/cli/crawl';
import { config } from '@/config/config';

type CrawlCommandTestCase = {
  should: string;
  entries: HNEntry[];
  expectedOutput: string;
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
    },
    {
      should: 'display an empty JSON array when there are no entries',
      entries: [],
      expectedOutput: '[]',
    },
  ];

  it.each(testCases)('should $should', async ({ entries, expectedOutput }) => {
    const crawler = createCrawler(entries);
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const command = createCrawlCommand(crawler, true);

    await command.parseAsync(['node', 'hn-crawler', 'crawl'], { from: 'user' });

    expect(log).toHaveBeenCalledWith(expectedOutput);
    expect(crawler.execute).toHaveBeenCalledOnce();
    expect(crawler.execute).toHaveBeenCalledWith({
      url: config.newsCombinatorUrl,
      sortBy: 'comments',
      titleWords: { operator: 'gt', value: 5 },
    });
    log.mockRestore();
  });

  it('should display the generic message and exit non-zero when crawling fails', async () => {
    const failure = new Error('HTTP 503: unavailable');
    const crawler = { execute: vi.fn().mockRejectedValue(failure) };
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const exit = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process exit');
    }) as never);
    const command = createCrawlCommand(crawler, true);

    await expect(
      command.parseAsync(['node', 'hn-crawler', 'crawl'], { from: 'user' })
    ).rejects.toThrow('process exit');

    expect(error).toHaveBeenCalledWith(
      'An error occurred while running the crawler. Please try again.'
    );
    expect(exit).toHaveBeenCalledWith(1);
    expect(crawler.execute).toHaveBeenCalledOnce();
    expect(crawler.execute).toHaveBeenCalledWith({
      url: config.newsCombinatorUrl,
      sortBy: 'comments',
      titleWords: { operator: 'gt', value: 5 },
    });
    error.mockRestore();
    exit.mockRestore();
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
});
