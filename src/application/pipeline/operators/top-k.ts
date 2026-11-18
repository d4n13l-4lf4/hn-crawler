import type { AsyncOperator } from '@/application/pipeline/pipeline.types';

export function topK<T>(
  limit: number,
  extract: (item: T) => number
): AsyncOperator<T> {
  const window = Math.max(0, Math.floor(limit));

  return async function* (source) {
    const entries: Array<{ item: T; score: number; index: number }> = [];
    let index = 0;

    for await (const item of source) {
      const score = extract(item);
      if (window === 0) {
        index += 1;
        continue;
      }

      entries.push({ item, score, index });
      entries.sort(
        (left, right) => right.score - left.score || left.index - right.index
      );
      if (entries.length > window) entries.pop();
      index += 1;
    }

    for (const entry of entries) yield entry.item;
  };
}
