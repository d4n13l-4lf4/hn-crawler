export type AsyncStep<In, Out> = (
  source: AsyncIterable<In> | Iterable<In>
) => AsyncIterable<Out>;

async function* toAsyncIterable<T>(
  source: AsyncIterable<T> | Iterable<T>
): AsyncIterable<T> {
  yield* source;
}

export function pipeAsync(
  source: AsyncIterable<any> | Iterable<any>,
  ...steps: AsyncStep<any, any>[]
): AsyncIterable<any> {
  return steps.reduce((acc, step) => step(acc), toAsyncIterable(source));
}
