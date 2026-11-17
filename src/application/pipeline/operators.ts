// Pipeline operators for entry processing

import { HnEntry } from '../../domain/models';

export function filterByWordCount(minWords: number, maxWords: number) {
  return (entries: HnEntry[]): HnEntry[] => {
    return entries.filter((entry) => {
      const wordCount = entry.title.split(' ').length;
      return wordCount >= minWords && wordCount <= maxWords;
    });
  };
}

export function sortByPoints(entries: HnEntry[]): HnEntry[] {
  return [...entries].sort((a, b) => b.points - a.points);
}

export function sortByComments(entries: HnEntry[]): HnEntry[] {
  return [...entries].sort((a, b) => b.comments - a.comments);
}
