// Use case for crawling Hacker News

import { HnEntry } from '../domain/models';
import { EntrySourcePort } from './ports/entry-source.port';
import { UsageRepoPort } from './ports/usage-repo.port';

export class CrawlHnUseCase {
  constructor(
    private readonly entrySource: EntrySourcePort,
    private readonly usageRepo: UsageRepoPort
  ) {}

  async execute(): Promise<HnEntry[]> {
    const startTime = Date.now();

    try {
      const entries = await this.entrySource.fetchEntries();

      // Store usage data
      const duration = Date.now() - startTime;
      await this.usageRepo.storeUsage('crawl-hn', duration);

      return entries;
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.usageRepo.storeUsage('crawl-hn-error', duration);
      throw error;
    }
  }
}
