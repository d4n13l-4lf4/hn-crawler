// TypeScript definitions for pipeline types

import { HnEntry } from '../../domain/models';

export type EntryPipeline = (entries: HnEntry[]) => HnEntry[];
