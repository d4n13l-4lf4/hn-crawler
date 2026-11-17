// Port for retrieving entry sources

import { HnEntry } from '../../domain/models';

export interface EntrySourcePort {
  fetchEntries(): Promise<HnEntry[]>;
}
