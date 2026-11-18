import { HNEntry } from '@/domain/entities/hn-entry.entity';

export interface CrawlerPort {
  execute(url: string): Promise<HNEntry[]>;
}
