import type { AsyncOperator } from '@/application/pipeline/pipeline.types';

export function filter<T>(predicate: (item: T) => boolean): AsyncOperator<T> {
  return async function* (source) {
    for await (const item of source) {
      if (predicate(item)) yield item;
    }
  };
}
