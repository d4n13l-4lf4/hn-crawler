import { filterTitleWords } from '@/application/pipeline/steps/filter-title-words.step';
import { topK } from '@/application/pipeline/operators/top-k';
import { pipeAsync } from '@/application/pipeline/orchestrator/async.pipe';
import type { AsyncOperator } from '@/application/pipeline/pipeline.type';
import type { HNEntry } from '@/domain/entities/hn-entry.entity';
import type { TitleWordRule } from '@/domain/policies/entry-filter.policy';

export interface PipelineConfig {
  sortBy?: 'comments' | 'points';
  titleWords?: TitleWordRule;
}

export function createPipeline(config: PipelineConfig): AsyncOperator<HNEntry> {
  const steps: AsyncOperator<HNEntry>[] = [];
  if (config.titleWords) steps.push(filterTitleWords(config.titleWords));
  if (config.sortBy) {
    const sortByMetric = topK<HNEntry>(30, (entry) =>
      config.sortBy === 'comments'
        ? entry.number_of_comments.value
        : entry.points.value
    );
    steps.push(sortByMetric);
  }

  return async function* (source) {
    for await (const entry of pipeAsync(source, ...steps)) yield entry;
  };
}

export const pipelineFactory = { create: createPipeline };
