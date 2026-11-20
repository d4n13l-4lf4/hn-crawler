import { describe, expect, it, vi } from 'vitest';
import { HNEntry } from '@/domain/entities/hn-entry.entity';
import { HnWebAdapter } from '@/infrastructure/web/hn-web.adapter';

function buildEntryHtml(entryCount: number): string {
  const rows: string[] = [];
  for (let i = 1; i <= entryCount; i += 1) {
    rows.push(
      `<tr class="athing submission" id="${i}"><td class="title"><span class="titleline"><a>Story ${i}</a></span></td></tr>` +
        `<tr><td class="subtext"><span class="score">${100 - i} points</span><a href="item?id=${i}">${100 - i} comments</a></td></tr>`
    );
  }
  return `<table>${rows.join('')}</table>`;
}

const emptyHtml = '<table></table>';

type AdapterTestCase = {
  should: string;
  pageHtml: (page: number) => string;
  maxEntries: number;
  maxPagesToFetch: number;
  expectedCount: number;
  expectedFetchPageCalls: number[];
};

describe('HN web adapter unit test', () => {
  const testCases: AdapterTestCase[] = [
    {
      should: 'yield up to maxEntries from page 1 and stop',
      pageHtml: () => buildEntryHtml(30),
      maxEntries: 10,
      maxPagesToFetch: 10,
      expectedCount: 10,
      expectedFetchPageCalls: [1],
    },
    {
      should: 'yield all entries when page 1 has fewer than maxEntries',
      pageHtml: (page) => (page === 1 ? buildEntryHtml(5) : emptyHtml),
      maxEntries: 30,
      maxPagesToFetch: 10,
      expectedCount: 5,
      expectedFetchPageCalls: [1, 2],
    },
    {
      should: 'paginate across pages until maxEntries reached',
      pageHtml: (page) => (page <= 2 ? buildEntryHtml(10) : emptyHtml),
      maxEntries: 25,
      maxPagesToFetch: 10,
      expectedCount: 20,
      expectedFetchPageCalls: [1, 2, 3],
    },
    {
      should: 'stop at maxPagesToFetch bound even if more entries exist',
      pageHtml: () => buildEntryHtml(30),
      maxEntries: 100,
      maxPagesToFetch: 2,
      expectedCount: 60,
      expectedFetchPageCalls: [1, 2],
    },
  ];

  it.each(testCases)(
    'should $should',
    async ({
      pageHtml,
      maxEntries,
      maxPagesToFetch,
      expectedCount,
      expectedFetchPageCalls,
    }) => {
      const fetchPage = vi.fn((page: number) => {
        return Promise.resolve(pageHtml(page));
      });
      const adapter = new HnWebAdapter({ fetchPage } as never, maxPagesToFetch);
      const result: HNEntry[] = [];
      for await (const entry of adapter.fetchEntries(maxEntries)) {
        result.push(entry);
      }

      expect(result).toHaveLength(expectedCount);
      expect(fetchPage).toHaveBeenCalledTimes(expectedFetchPageCalls.length);
      expectedFetchPageCalls.forEach((call, index) => {
        expect(fetchPage).toHaveBeenNthCalledWith(index + 1, call);
      });
    }
  );

  it('should propagate HTTP client errors without replacing them', async () => {
    const failure = new TypeError('network unavailable');
    const fetchPage = vi.fn().mockRejectedValue(failure);
    const adapter = new HnWebAdapter({ fetchPage } as never, 10);

    await expect(collect(adapter.fetchEntries(30))).rejects.toBe(failure);
    expect(fetchPage).toHaveBeenCalledOnce();
  });
});

async function collect(source: AsyncIterable<HNEntry>): Promise<HNEntry[]> {
  const result: HNEntry[] = [];
  for await (const entry of source) result.push(entry);
  return result;
}
