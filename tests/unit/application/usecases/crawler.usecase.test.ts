import { describe, expect, it, vi } from 'vitest';
import { CrawlerUseCase } from '@/application/usecases/crawler.usecase';
import { HNEntry } from '@/domain/entities/hn-entry.entity';

type CrawlerUseCaseTestCase = {
  should: string;
  when: string;
  sourceEntries: number;
  expectedEntries: number;
  expectedLastRank: number;
};

async function* entries(count: number): AsyncGenerator<HNEntry> {
  for (let rank = 1; rank <= count; rank += 1) {
    yield new HNEntry(rank, `Story ${rank}`, rank, rank + 1);
  }
}

describe('CrawlerUseCase Unit Test', () => {
  const testCases: CrawlerUseCaseTestCase[] = [
    {
      should: 'return all entries in source order',
      when: 'the source has fewer than 30 entries',
      sourceEntries: 3,
      expectedEntries: 3,
      expectedLastRank: 3,
    },
    {
      should: 'return only the first 30 entries in source order',
      when: 'the source has more than 30 entries',
      sourceEntries: 31,
      expectedEntries: 30,
      expectedLastRank: 30,
    },
    {
      should: 'return an empty list',
      when: 'the source has no entries',
      sourceEntries: 0,
      expectedEntries: 0,
      expectedLastRank: 0,
    },
  ];

  it.each(testCases)(
    'should $should when $when',
    async ({ sourceEntries, expectedEntries, expectedLastRank }) => {
      const fetchEntries = vi.fn(() => entries(sourceEntries));
      const useCase = new CrawlerUseCase({ fetchEntries });

      const result = await useCase.execute('https://example.com/news');

      expect(result).toHaveLength(expectedEntries);
      expect(result.map((entry) => entry.rank.value)).toEqual(
        Array.from({ length: expectedEntries }, (_, index) => index + 1)
      );
      expect(result.at(-1)?.rank.value ?? 0).toBe(expectedLastRank);
      expect(fetchEntries).toHaveBeenCalledOnce();
      expect(fetchEntries).toHaveBeenCalledWith('https://example.com/news');
    }
  );

  it('should pass a provided URL to the entry source', async () => {
    const fetchEntries = vi.fn(() => entries(1));
    const useCase = new CrawlerUseCase({ fetchEntries });

    const result = await useCase.execute('https://example.com/news');

    expect(result).toEqual([new HNEntry(1, 'Story 1', 1, 2)]);
    expect(fetchEntries).toHaveBeenCalledOnce();
    expect(fetchEntries).toHaveBeenCalledWith('https://example.com/news');
  });

  it('should pass the provided configured URL to the entry source unchanged', async () => {
    const fetchEntries = vi.fn(() => entries(1));
    const useCase = new CrawlerUseCase({ fetchEntries });

    const configuredUrl = 'https://news.ycombinator.com/';
    const result = await useCase.execute(configuredUrl);

    expect(result).toEqual([new HNEntry(1, 'Story 1', 1, 2)]);
    expect(fetchEntries).toHaveBeenCalledOnce();
    expect(fetchEntries).toHaveBeenCalledWith(configuredUrl);
  });

  it('should stop consuming the source after the 30th entry', async () => {
    const source = { fetchEntries: vi.fn(() => entries(31)) };
    const useCase = new CrawlerUseCase(source);

    const result = await useCase.execute('https://news.ycombinator.com/');

    expect(result).toHaveLength(30);
    expect(result[0].rank.value).toBe(1);
    expect(result[29].rank.value).toBe(30);
    expect(source.fetchEntries).toHaveBeenCalledOnce();
    expect(source.fetchEntries).toHaveBeenCalledWith(
      'https://news.ycombinator.com/'
    );
  });
});
