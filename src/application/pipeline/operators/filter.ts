import { AsyncOperator } from '@/application/pipeline/operators/util';

export const filter = <T>(predicate: (item: T) => boolean): AsyncOperator<T> =>
  async function* (source) {
    for await (const item of source) {
      if (predicate(item)) yield item;
    }
  };
