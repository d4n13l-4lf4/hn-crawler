import { HNEntry } from '@/domain/entities/hn-entry.entity';
import type { TitleWordRule } from '@/domain/policies/entry-filter.policy';

export interface CrawlRequest {
  maxEntries: number;
  sortBy?: 'comments' | 'points';
  titleWords?: TitleWordRule;
}

export type EntryPipeline = (
  source: AsyncIterable<HNEntry>
) => AsyncIterable<HNEntry>;

export interface PipelineFactory {
  create(config: {
    sortBy?: 'comments' | 'points';
    titleWords?: TitleWordRule;
  }): EntryPipeline;
}

export interface CrawlerPort {
  execute(request: CrawlRequest): Promise<HNEntry[]>;
}
