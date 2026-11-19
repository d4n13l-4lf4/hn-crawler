import { describe, expect, it, vi } from 'vitest';
import { CrawlerUseCase } from '@/application/usecases/crawler.usecase';
import { HNEntry } from '@/domain/entities/hn-entry.entity';
import type {
  CrawlRequest,
  PipelineFactory,
} from '@/application/ports/in/crawler.port';
import { drain } from '../../../helpers/async';

type CrawlerUseCaseTestCase = {
  should: string;
  when: string;
  sourceEntries: HNEntry[];
  expectedPipelineInput: HNEntry[];
  pipelineResult: HNEntry[];
  request: CrawlRequest;
  expectedEntries: HNEntry[];
};

async function* from(entries: HNEntry[]): AsyncGenerator<HNEntry> {
  yield* entries;
}

describe('CrawlerUseCase Unit Test', () => {
  const sourceEntries = [
    new HNEntry(1, 'one', 1, 1),
    new HNEntry(2, 'two', 2, 2),
    new HNEntry(3, 'three', 3, 3),
  ];
  const filteredEntries = [sourceEntries[2], sourceEntries[0]];

  const testCases: CrawlerUseCaseTestCase[] = [
    {
      should: 'return the entries produced by the configured pipeline',
      when: 'filtering and ranking were requested',
      sourceEntries,
      expectedPipelineInput: sourceEntries,
      pipelineResult: filteredEntries,
      request: {
        url: 'https://example.com/news',
        sortBy: 'points',
        titleWords: { operator: 'gt', value: 5 },
      },
      expectedEntries: filteredEntries,
    },
    {
      should: 'return an empty list when the pipeline has no matches',
      when: 'the requested title rule excludes every entry',
      sourceEntries,
      expectedPipelineInput: sourceEntries,
      pipelineResult: [],
      request: {
        url: 'https://example.com/news',
        sortBy: 'comments',
        titleWords: { operator: 'le', value: 5 },
      },
      expectedEntries: [],
    },
  ];

  it.each(testCases)(
    'should $should when $when',
    async ({
      sourceEntries,
      expectedPipelineInput,
      pipelineResult,
      request,
      expectedEntries,
    }) => {
      const fetchEntries = vi.fn(() => from(sourceEntries));
      const applyPipeline = vi.fn((_source: AsyncIterable<HNEntry>) =>
        from(pipelineResult)
      );
      const create = vi.fn(() => applyPipeline);
      const pipelineFactory: PipelineFactory = { create };
      const useCase = new CrawlerUseCase({ fetchEntries }, pipelineFactory);

      const result = await useCase.execute(request);

      expect(result).toEqual(expectedEntries);
      expect(fetchEntries).toHaveBeenCalledOnce();
      expect(fetchEntries).toHaveBeenCalledWith(request.url);
      expect(create).toHaveBeenCalledOnce();
      expect(create).toHaveBeenCalledWith({
        sortBy: request.sortBy,
        titleWords: request.titleWords,
      });
      expect(applyPipeline).toHaveBeenCalledOnce();
      const stream = applyPipeline.mock.calls[0][0];
      expect(await drain(stream)).toEqual(expectedPipelineInput);
    }
  );

  it('should limit the source to the first 30 entries before applying the pipeline', async () => {
    async function* manyEntries(): AsyncGenerator<HNEntry> {
      for (let rank = 1; rank <= 35; rank += 1) {
        yield new HNEntry(rank, `Story ${rank}`, rank, rank);
      }
    }

    let received: HNEntry[] = [];
    const applyPipeline = vi.fn(async function* (
      source: AsyncIterable<HNEntry>
    ) {
      for await (const entry of source) {
        received.push(entry);
        yield entry;
      }
    });
    const create = vi.fn(() => applyPipeline);
    const fetchEntries = vi.fn(() => manyEntries());
    const useCase = new CrawlerUseCase({ fetchEntries }, { create });

    const result = await useCase.execute({
      url: 'https://news.ycombinator.com/',
      sortBy: 'comments',
    });

    expect(result).toHaveLength(30);
    expect(result[0].rank.value).toBe(1);
    expect(result[29].rank.value).toBe(30);
    expect(received).toHaveLength(30);
    expect(create).toHaveBeenCalledOnce();
    expect(create).toHaveBeenCalledWith({
      sortBy: 'comments',
      titleWords: undefined,
    });
    expect(fetchEntries).toHaveBeenCalledOnce();
    expect(fetchEntries).toHaveBeenCalledWith('https://news.ycombinator.com/');
  });

  it('should propagate an entry-source error', async () => {
    const fetchEntries = vi.fn(async function* () {
      throw new Error('source failed');
    });
    const create = vi.fn(() => async function* () {});
    const useCase = new CrawlerUseCase({ fetchEntries }, { create });

    await expect(
      useCase.execute({ url: 'https://example.com', sortBy: 'comments' })
    ).rejects.toThrow('source failed');
    expect(fetchEntries).toHaveBeenCalledOnce();
    expect(create).not.toHaveBeenCalled();
  });

  it('should propagate a pipeline error', async () => {
    const fetchEntries = vi.fn(() => from(sourceEntries));
    const brokenPipeline = vi.fn(async function* () {
      throw new Error('pipeline failed');
    });
    const create = vi.fn(() => brokenPipeline);
    const useCase = new CrawlerUseCase({ fetchEntries }, { create });

    await expect(
      useCase.execute({ url: 'https://example.com', sortBy: 'comments' })
    ).rejects.toThrow('pipeline failed');
    expect(fetchEntries).toHaveBeenCalledOnce();
    expect(create).toHaveBeenCalledOnce();
    expect(create).toHaveBeenCalledWith({
      sortBy: 'comments',
      titleWords: undefined,
    });
  });
});
