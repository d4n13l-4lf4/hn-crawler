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
};

describe('HN web adapter unit test', () => {
  const testCases: AdapterTestCase[] = [
    {
      should: 'use the default Hacker News URL from configuration',
    },
  ];

  it.each(testCases)('should $should', async () => {
    const fetchPage = vi.fn().mockResolvedValue(sampleHtml);
    const adapter = new HnWebAdapter({ fetchPage } as never);
    const result: HNEntry[] = [];

    for await (const entry of adapter.fetchEntries()) result.push(entry);

    expect(result).toHaveLength(30);
    expect(result[0]).toEqual(
      new HNEntry(
        1,
        'Java4Shell: RCE in OpenJDK when processing Base64',
        795,
        211
      )
    );
    expect(fetchPage).toHaveBeenCalledOnce();
  });

  it('should propagate HTTP client errors without replacing them', async () => {
    const failure = new TypeError('network unavailable');
    const fetchPage = vi.fn().mockRejectedValue(failure);
    const adapter = new HnWebAdapter({ fetchPage } as never);

    await expect(collect(adapter.fetchEntries())).rejects.toBe(failure);
    expect(fetchPage).toHaveBeenCalledOnce();
  });
});

async function collect(source: AsyncIterable<HNEntry>): Promise<HNEntry[]> {
  const result: HNEntry[] = [];
  for await (const entry of source) result.push(entry);
  return result;
}
