import { describe, expect, it, vi } from 'vitest';
import { CrawlerPort } from '../../../../src/application/ports/in/crawler.port';
import { HNEntry } from '../../../../src/domain/entities/hn-entry.entity';
import { createCrawlCommand } from '../../../../src/presentation/cli/crawl';

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
    expect(crawler.execute).toHaveBeenCalledWith(undefined);
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
    expect(crawler.execute).toHaveBeenCalledWith(undefined);
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
    expect(crawler.execute).toHaveBeenCalledWith('http://127.0.0.1:4321');
    vi.restoreAllMocks();
  });
});
