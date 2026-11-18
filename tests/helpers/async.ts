export async function* toAsyncIterable<T>(source: T[]): AsyncGenerator<T> {
  yield* source;
}

// Deliberately independent from the production `collect` operator,
// so operator tests never depend on each other. Keep it a plain loop.
export async function drain<T>(source: AsyncIterable<T>): Promise<T[]> {
  const items: T[] = [];
  for await (const item of source) items.push(item);
  return items;
}
