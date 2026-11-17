// Pipeline for processing short titles

import { HnEntry } from '../../../domain/models';
import { EntryPipeline } from '../../pipeline/pipeline.types';

export const shortTitlesPipeline: EntryPipeline = (
  entries: HnEntry[]
): HnEntry[] => {
  return entries;
};
