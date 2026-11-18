import { describe, expect, it, vi } from 'vitest';
import { HNEntry } from '@/domain/entities/hn-entry.entity';
import { HnWebAdapter } from '@/infrastructure/web/hn-web.adapter';

async function* entries(): AsyncGenerator<HNEntry> {
  yield new HNEntry(1, 'Story', 10, 2);
}

type AdapterTestCase = {
  should: string;
  url: string | undefined;
  expectedUrl: string;
};

describe('HN web adapter unit test', () => {
  const testCases: AdapterTestCase[] = [
    {
      should: 'use the default Hacker News URL',
      url: undefined,
      expectedUrl: 'https://news.ycombinator.com/',
    },
    {
      should: 'pass a provided URL through unchanged',
      url: 'http://127.0.0.1:4321/news',
      expectedUrl: 'http://127.0.0.1:4321/news',
    },
  ];

  it.each(testCases)('should $should', async ({ url, expectedUrl }) => {
    const html = '<html>fixture</html>';
    const fetch = vi.fn().mockResolvedValue(html);
    const parse = vi.fn(() => entries());
    const adapter = new HnWebAdapter({ fetch }, { parse });
    const result: HNEntry[] = [];

    for await (const entry of adapter.fetchEntries(url)) result.push(entry);

    expect(result).toEqual([new HNEntry(1, 'Story', 10, 2)]);
    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledWith(expectedUrl);
    expect(parse).toHaveBeenCalledOnce();
    expect(parse).toHaveBeenCalledWith(html);
  });

  it('should propagate HTTP client errors without replacing them', async () => {
    const failure = new TypeError('network unavailable');
    const fetch = vi.fn().mockRejectedValue(failure);
    const parse = vi.fn(() => entries());
    const adapter = new HnWebAdapter({ fetch }, { parse });

    await expect(collect(adapter.fetchEntries())).rejects.toBe(failure);
    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledWith('https://news.ycombinator.com/');
    expect(parse).not.toHaveBeenCalled();
  });
});

async function collect(source: AsyncIterable<HNEntry>): Promise<HNEntry[]> {
  const result: HNEntry[] = [];
  for await (const entry of source) result.push(entry);
  return result;
}
