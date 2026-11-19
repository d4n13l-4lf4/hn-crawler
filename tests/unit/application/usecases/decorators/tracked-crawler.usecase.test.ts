import { describe, expect, it, vi } from 'vitest';
import type {
  CrawlerPort,
  CrawlRequest,
} from '@/application/ports/in/crawler.port';
import type { UsageRepositoryPort } from '@/application/ports/out/usage-repository.port';
import { TrackedCrawlerUseCase } from '@/application/usecases/decorators/tracked-crawler.usecase';
import { HNEntry } from '@/domain/entities/hn-entry.entity';
import { AppliedFilters } from '@/domain/vo/applied-filters.vo';
import { Usage } from '@/domain/entities/usage.entity';

type TrackedCrawlerTestCase = {
  should: string;
  when: string;
  request: CrawlRequest;
  result: HNEntry[];
  expectedFilters: string;
  timestamps: [number, number];
  durations: [number, number];
};

describe('TrackedCrawlerUseCase unit test', () => {
  const entries = [new HNEntry(1, 'First', 10, 5)];
  const requests: TrackedCrawlerTestCase[] = [
    {
      should: 'return the crawler result and record selected operations',
      when: 'the crawler succeeds with explicit filter and ranking options',
      request: {
        url: 'https://example.test',
        sortBy: 'comments',
        titleWords: { operator: 'gt', value: 5 },
      },
      result: entries,
      expectedFilters: 'sort:number_of_comments:desc,filter:title_words:gt:5',
      timestamps: [1000, 1004],
      durations: [50, 54],
    },
    {
      should: 'return the crawler result and record ranking only',
      when: 'the crawler succeeds with points ranking only',
      request: { url: 'https://example.test', sortBy: 'points' },
      result: [],
      expectedFilters: 'sort:number_of_points:desc',
      timestamps: [2000, 2000],
      durations: [80, 80],
    },
    {
      should: 'return the crawler result and record none',
      when: 'the crawler succeeds with no filter or ranking options',
      request: { url: 'https://example.test' },
      result: entries,
      expectedFilters: 'none',
      timestamps: [3000, 3000],
      durations: [90, 95],
    },
  ];

  it.each(requests)('should $should when $when', async (testCase) => {
    const execute = vi.fn().mockResolvedValue(testCase.result);
    const save = vi.fn();
    const clock = vi
      .fn()
      .mockReturnValueOnce(testCase.timestamps[0])
      .mockReturnValueOnce(testCase.timestamps[1]);
    const monotonicClock = vi
      .fn()
      .mockReturnValueOnce(testCase.durations[0])
      .mockReturnValueOnce(testCase.durations[1]);
    const idGenerator = vi
      .fn()
      .mockReturnValue('018f0f4b-7b7c-7abc-8def-0123456789ab');
    const crawler: CrawlerPort = { execute };
    const repository: UsageRepositoryPort = { save, getAll: () => [] };
    const useCase = new TrackedCrawlerUseCase(
      crawler,
      repository,
      clock,
      monotonicClock,
      idGenerator
    );

    const result = await useCase.execute(testCase.request);

    expect(result).toBe(testCase.result);
    expect(execute).toHaveBeenCalledOnce();
    expect(execute).toHaveBeenCalledWith(testCase.request);
    expect(clock).toHaveBeenCalledOnce();
    expect(monotonicClock).toHaveBeenCalledTimes(2);
    expect(idGenerator).toHaveBeenCalledOnce();
    expect(save).toHaveBeenCalledOnce();
    const usage = save.mock.calls[0][0] as Usage;
    expect(usage).toBeInstanceOf(Usage);
    expect(usage).toMatchObject({
      request_id: '018f0f4b-7b7c-7abc-8def-0123456789ab',
      request_timestamp: testCase.timestamps[0],
      duration_ms: Math.floor(testCase.durations[1] - testCase.durations[0]),
    });
    expect(usage.applied_filters.toString()).toBe(testCase.expectedFilters);
  });

  it('should preserve the original crawler error when the crawl fails', async () => {
    const failure = new Error('crawler failed');
    const execute = vi.fn().mockRejectedValue(failure);
    const save = vi.fn();
    const request = {
      url: 'https://example.test',
      sortBy: 'comments',
    } as const;
    const useCase = new TrackedCrawlerUseCase(
      { execute },
      { save, getAll: () => [] },
      () => 500,
      vi.fn().mockReturnValueOnce(1).mockReturnValueOnce(3),
      () => '018f0f4b-7b7c-7abc-8def-0123456789ab'
    );

    await expect(useCase.execute(request)).rejects.toBe(failure);

    expect(execute).toHaveBeenCalledWith(request);
    expect(save).toHaveBeenCalledOnce();
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        request_timestamp: 500,
        applied_filters: AppliedFilters.builder().sortBy('comments').build(),
        duration_ms: 2,
      })
    );
  });

  it.each([
    {
      should: 'preserve a successful result',
      when: 'saving the usage entry fails after a successful crawl',
      failure: new Error('repository failed'),
    },
    {
      should: 'preserve the original crawler error',
      when: 'saving the usage entry also fails after a failed crawl',
      failure: new Error('repository failed after crawl error'),
    },
  ])('should $should when $when', async ({ failure }) => {
    const crawlerFailure = new Error('crawler failed');
    const result = [new HNEntry(1, 'Story', 1, 1)];
    const execute = vi.fn(
      failure.message.includes('after crawl error')
        ? () => Promise.reject(crawlerFailure)
        : () => Promise.resolve(result)
    );
    const save = vi.fn().mockImplementation(() => {
      throw failure;
    });
    const useCase = new TrackedCrawlerUseCase(
      { execute },
      { save, getAll: () => [] },
      () => 500,
      vi.fn().mockReturnValueOnce(1).mockReturnValueOnce(3),
      () => '018f0f4b-7b7c-7abc-8def-0123456789ab'
    );
    const request = {
      url: 'https://example.test',
      sortBy: 'comments',
    } as const;

    if (failure.message.includes('after crawl error')) {
      await expect(useCase.execute(request)).rejects.toBe(crawlerFailure);
    } else {
      await expect(useCase.execute(request)).resolves.toBe(result);
    }

    expect(execute).toHaveBeenCalledWith(request);
    expect(save).toHaveBeenCalledOnce();
  });

  it('should use default runtime providers when clocks and ID generator are omitted', async () => {
    const result = [new HNEntry(1, 'Story', 1, 1)];
    const execute = vi.fn().mockResolvedValue(result);
    const save = vi.fn();
    const useCase = new TrackedCrawlerUseCase(
      { execute },
      { save, getAll: () => [] }
    );

    await expect(
      useCase.execute({ url: 'https://example.test', sortBy: 'comments' })
    ).resolves.toBe(result);

    expect(execute).toHaveBeenCalledOnce();
    expect(save).toHaveBeenCalledOnce();
    const usage = save.mock.calls[0][0] as Usage;
    expect(usage.request_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
    expect(usage.request_timestamp).toEqual(expect.any(Number));
    expect(usage.duration_ms).toEqual(expect.any(Number));
    expect(usage.duration_ms).toBeGreaterThanOrEqual(0);
  });
});
