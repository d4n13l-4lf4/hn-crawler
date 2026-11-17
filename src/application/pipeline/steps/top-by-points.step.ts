// Top entries by points step

import { HnEntry } from '../../../domain/models';
import { EntryPipeline } from '../../pipeline/pipeline.types';

export const topByPointsStep: EntryPipeline = (
  entries: HnEntry[]
): HnEntry[] => {
  return entries;
};
