import { CrawlerPort } from '../ports/in/crawler.port';
import { EntrySourcePort } from '../ports/out/entry-source.port';
import { HNEntry } from '../../domain/entities/hn-entry.entity';

export class CrawlerUseCase implements CrawlerPort {
  constructor(private readonly entrySource: EntrySourcePort) {}

  async execute(url?: string): Promise<HNEntry[]> {
    const entries: HNEntry[] = [];
    const source = this.entrySource.fetchEntries(
      url ?? 'https://news.ycombinator.com/'
    );

    for await (const entry of source) {
      entries.push(entry);
      if (entries.length === 30) break;
    }

    return entries;
  }
}
