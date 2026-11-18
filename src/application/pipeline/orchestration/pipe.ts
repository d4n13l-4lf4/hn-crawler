import { toAsyncIterable } from '@/application/pipeline/util/helper';

export type AsyncStep<In, Out> = (
  source: AsyncIterable<In> | Iterable<In>
) => AsyncIterable<Out>;

export function pipeAsync(
  source: AsyncIterable<any> | Iterable<any>,
  ...steps: AsyncStep<any, any>[]
): AsyncIterable<any> {
  return steps.reduce((acc, step) => step(acc), toAsyncIterable(source));
}
