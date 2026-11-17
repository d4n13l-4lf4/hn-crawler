// Filter step for entries with more than five words

import { HnEntry } from '../../../domain/models';
import { EntryPipeline } from '../../pipeline/pipeline.types';

export const filterMoreThanFiveWordsStep: EntryPipeline = (
  entries: HnEntry[]
): HnEntry[] => {
  return entries;
};
