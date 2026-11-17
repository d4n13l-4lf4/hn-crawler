// Pipeline for processing long titles

import { HnEntry } from '../../../domain/models';
import { EntryPipeline } from '../../pipeline/pipeline.types';

export const longTitlesPipeline: EntryPipeline = (
  entries: HnEntry[]
): HnEntry[] => {
  return entries;
};
