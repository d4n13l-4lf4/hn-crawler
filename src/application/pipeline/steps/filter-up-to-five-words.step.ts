// Filter step for entries with up to five words

import { HnEntry } from '../../../domain/models';
import { EntryPipeline } from '../../pipeline/pipeline.types';

export const filterUpToFiveWordsStep: EntryPipeline = (
  entries: HnEntry[]
): HnEntry[] => {
  return entries;
};
