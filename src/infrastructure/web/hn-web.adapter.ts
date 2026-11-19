import { EntrySourcePort } from '@/application/ports/out/entry-source.port';
import { HNEntry } from '@/domain/entities/hn-entry.entity';
import { HnCrawlerParser } from '@/infrastructure/web/hn-crawler.parser';
import { HnHttpClient } from '@/infrastructure/web/hn-http.client';

export class HnWebAdapter implements EntrySourcePort {
  constructor(private readonly httpClient: HnHttpClient) {}

  async *fetchEntries(): AsyncGenerator<HNEntry> {
    const html = await this.httpClient.fetchPage('');
    const parser = new HnCrawlerParser(html);
    yield* parser;
  }
}
