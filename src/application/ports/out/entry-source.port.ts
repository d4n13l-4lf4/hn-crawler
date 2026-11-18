import { HNEntry } from '@/domain/entities/hn-entry.entity';

export interface EntrySourcePort {
  fetchEntries(url: string): AsyncIterable<HNEntry>;
}
