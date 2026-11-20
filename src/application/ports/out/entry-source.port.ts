import { HNEntry } from '@/domain/entities/hn-entry.entity';

export interface EntrySourcePort {
  fetchEntries(maxEntries: number): AsyncIterable<HNEntry>;
}
