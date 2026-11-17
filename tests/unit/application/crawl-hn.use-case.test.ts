import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { HnEntry } from '../../../src/domain/models';
import { CrawlHnUseCase } from '../../../src/application/crawl-hn.use-case';

describe('CrawlHnUseCase', () => {
  const entries: HnEntry[] = [
    { number: 1, title: 'A title', points: 5, comments: 2 },
  ];
  const fetchEntries = vi.fn<() => Promise<HnEntry[]>>();
  const storeUsage =
    vi.fn<(command: string, durationMs: number) => Promise<void>>();
  const useCase = new CrawlHnUseCase({ fetchEntries }, { storeUsage });

  beforeEach(() => {
    fetchEntries.mockReset();
    storeUsage.mockReset();
  });

  it('returns fetched entries and stores successful usage', async () => {
    fetchEntries.mockResolvedValue(entries);
    storeUsage.mockResolvedValue();

    await expect(useCase.execute()).resolves.toBe(entries);
    expect(storeUsage).toHaveBeenCalledWith('crawl-hn', expect.any(Number));
  });

  it('stores failed usage and rethrows source errors', async () => {
    const failure = new Error('fetch failed');
    fetchEntries.mockRejectedValue(failure);
    storeUsage.mockResolvedValue();

    await expect(useCase.execute()).rejects.toBe(failure);
    expect(storeUsage).toHaveBeenCalledWith(
      'crawl-hn-error',
      expect.any(Number)
    );
  });
});
