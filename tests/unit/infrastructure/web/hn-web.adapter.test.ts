import { describe, expect, it, vi } from 'vitest';
import { HNEntry } from '@/domain/entities/hn-entry.entity';
import { HnWebAdapter } from '@/infrastructure/web/hn-web.adapter';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const sampleHtml = readFileSync(
  resolve(process.cwd(), 'tests/resources/hacker-news.html'),
  'utf8'
);

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
    const fetch = vi.fn().mockResolvedValue(sampleHtml);
    const adapter = new HnWebAdapter({ fetch });
    const result: HNEntry[] = [];

    for await (const entry of adapter.fetchEntries(url)) result.push(entry);

    expect(result).toHaveLength(30);
    expect(result[0]).toEqual(
      new HNEntry(
        1,
        'Java4Shell: RCE in OpenJDK when processing Base64',
        795,
        211
      )
    );
    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledWith(expectedUrl);
  });

  it('should propagate HTTP client errors without replacing them', async () => {
    const failure = new TypeError('network unavailable');
    const fetch = vi.fn().mockRejectedValue(failure);
    const adapter = new HnWebAdapter({ fetch });

    await expect(collect(adapter.fetchEntries())).rejects.toBe(failure);
    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledWith('https://news.ycombinator.com/');
  });
});

async function collect(source: AsyncIterable<HNEntry>): Promise<HNEntry[]> {
  const result: HNEntry[] = [];
  for await (const entry of source) result.push(entry);
  return result;
}
