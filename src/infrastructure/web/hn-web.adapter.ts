import { EntrySourcePort } from '@/application/ports/out/entry-source.port';
import { HNEntry } from '@/domain/entities/hn-entry.entity';
import { fetchPage } from '@/infrastructure/web/hn-http.client';
import { parseHnEntries } from '@/infrastructure/web/hn-crawler.parser';

const DEFAULT_URL = 'https://news.ycombinator.com/';

export class HnWebAdapter implements EntrySourcePort {
  constructor(
    private readonly httpClient: { fetch: (url: string) => Promise<string> } = {
      fetch: fetchPage,
    },
    private readonly parser: {
      parse: (html: string) => AsyncIterable<HNEntry>;
    } = {
      parse: parseHnEntries,
    }
  ) {}

  async *fetchEntries(url = DEFAULT_URL): AsyncGenerator<HNEntry> {
    const html = await this.httpClient.fetch(url);
    yield* this.parser.parse(html);
  }
}
