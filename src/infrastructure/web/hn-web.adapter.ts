import { EntrySourcePort } from '@/application/ports/out/entry-source.port';
import { HNEntry } from '@/domain/entities/hn-entry.entity';
import { HnCrawlerParser } from '@/infrastructure/web/hn-crawler.parser';
import { HnHttpClient } from '@/infrastructure/web/hn-http.client';

export class HnWebAdapter implements EntrySourcePort {
  constructor(
    private readonly httpClient: HnHttpClient,
    private readonly maxPagesToFetch: number
  ) {}

  async *fetchEntries(maxEntries: number): AsyncGenerator<HNEntry> {
    let entriesYielded = 0;

    for (let page = 1; page <= this.maxPagesToFetch; page += 1) {
      const html = await this.httpClient.fetchPage(page);
      const parser = new HnCrawlerParser(html);

      if (!parser.hasEntries()) {
        break;
      }

      for await (const entry of parser) {
        if (entriesYielded >= maxEntries) {
          return;
        }
        yield entry;
        entriesYielded += 1;
      }
    }
  }
}
