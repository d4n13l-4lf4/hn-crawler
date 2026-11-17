// Pipeline implementation for processing entries

export function pipe<T>(
  initialValue: T,
  ...functions: Array<(value: T) => T>
): T {
  return functions.reduce((acc, fn) => fn(acc), initialValue);
}
