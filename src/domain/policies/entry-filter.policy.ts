import type { HNEntry } from '@/domain/entities/hn-entry.entity';

export type TitleWordRule = {
  operator: 'gt' | 'le';
  value: number;
};

const WORD_CHARACTER = /[\p{L}\p{N}]/u;

export function countTitleWords(title: string): number {
  return title
    .trim()
    .split(/\s+/)
    .filter((word) => WORD_CHARACTER.test(word)).length;
}

export function createEntryFilter(
  rule: TitleWordRule
): (entry: HNEntry) => boolean {
  return (entry) => {
    const wordCount = countTitleWords(entry.title.value);
    return rule.operator === 'gt'
      ? wordCount > rule.value
      : wordCount <= rule.value;
  };
}
