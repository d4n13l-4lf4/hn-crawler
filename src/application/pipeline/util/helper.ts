export async function* toAsyncIterable<T>(
  source: AsyncIterable<T> | Iterable<T>
): AsyncIterable<T> {
  yield* source;
}
