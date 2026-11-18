import { filter } from '@/application/pipeline/operators/filter';
import type { AsyncOperator } from '@/application/pipeline/pipeline.types';
import {
  createEntryFilter,
  TitleWordRule,
} from '@/domain/policies/entry-filter.policy';
import type { HNEntry } from '@/domain/entities/hn-entry.entity';

export function filterTitleWords(rule: TitleWordRule): AsyncOperator<HNEntry> {
  return filter(createEntryFilter(rule));
}
