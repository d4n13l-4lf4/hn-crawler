// Top entries by comments step

import { HnEntry } from '../../../domain/models';
import { EntryPipeline } from '../../pipeline/pipeline.types';

export const topByCommentsStep: EntryPipeline = (
  entries: HnEntry[]
): HnEntry[] => {
  return entries;
};
