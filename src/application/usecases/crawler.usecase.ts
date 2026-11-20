import {
  CrawlerPort,
  CrawlRequest,
  PipelineFactory,
} from '@/application/ports/in/crawler.port';
import { EntrySourcePort } from '@/application/ports/out/entry-source.port';
import { HNEntry } from '@/domain/entities/hn-entry.entity';

export class CrawlerUseCase implements CrawlerPort {
  constructor(
    private readonly entrySource: EntrySourcePort,
    private readonly pipelineFactory: PipelineFactory
  ) {}

  async execute(request: CrawlRequest): Promise<HNEntry[]> {
    const source = this.entrySource.fetchEntries(request.maxEntries);

    const pipeline = this.pipelineFactory.create({
      sortBy: request.sortBy,
      titleWords: request.titleWords,
    });
    const result: HNEntry[] = [];
    for await (const entry of pipeline(source)) {
      result.push(entry);
    }
    return result;
  }
}
