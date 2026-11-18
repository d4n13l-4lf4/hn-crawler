import { randomUUIDv7 } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import type {
  CrawlerPort,
  CrawlRequest,
} from '@/application/ports/in/crawler.port';
import type { UsageRepositoryPort } from '@/application/ports/out/usage-repository.port';
import { mapAppliedFilters } from '@/application/mappers/applied-filters.mapper';
import { Usage } from '@/domain/entities/usage.entity';
import type { HNEntry } from '@/domain/entities/hn-entry.entity';

export class TrackedCrawlerUseCase implements CrawlerPort {
  constructor(
    private readonly crawler: CrawlerPort,
    private readonly usageRepository: UsageRepositoryPort,
    private readonly now: () => number = Date.now,
    private readonly monotonicNow: () => number = () => performance.now(),
    private readonly createRequestId: () => string = randomUUIDv7
  ) {}

  async execute(request: CrawlRequest): Promise<HNEntry[]> {
    const requestTimestamp = this.now();
    const start = this.monotonicNow();

    try {
      return await this.crawler.execute(request);
    } finally {
      try {
        const usage = new Usage(
          this.createRequestId(),
          requestTimestamp,
          mapAppliedFilters(request),
          Math.max(0, Math.floor(this.monotonicNow() - start))
        );
        await this.usageRepository.save(usage);
      } catch {
        // Usage tracking must not change the crawler result or original error.
      }
    }
  }
}
