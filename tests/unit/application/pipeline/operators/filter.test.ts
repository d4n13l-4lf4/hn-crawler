import { describe, it, expect } from 'vitest';
import { filter } from '@/application/pipeline/operators/filter';
import { drain, toAsyncIterable } from '../../../../helpers/async';

type FilterOperatorTestCase<T> = {
  should: string;
  when: string;
  input: T[];
  predicate: (item: T) => boolean;
  expected: T[];
};

describe('Filter Operator Unit Test', () => {
  const testCases: FilterOperatorTestCase<number | string>[] = [
    {
      should: 'keep negative numbers',
      when: 'the predicate matches negative numbers',
      input: [-1, 0, 1, -5, 10],
      predicate: (n) => typeof n === 'number' && n < 0,
      expected: [-1, -5],
    },
    {
      should: 'keep positive numbers',
      when: 'the predicate matches positive numbers',
      input: [-1, 0, 1, 5, -10],
      predicate: (n) => typeof n === 'number' && n > 0,
      expected: [1, 5],
    },
    {
      should: 'keep words starting with letter A',
      when: 'the source input contains words starting with A',
      input: ['Apple', 'Banana', 'Avocado', 'Orange'],
      predicate: (word) => typeof word === 'string' && word.startsWith('A'),
      expected: ['Apple', 'Avocado'],
    },
    {
      should: 'return an empty array',
      when: 'the source input is empty',
      input: [],
      predicate: () => true,
      expected: [],
    },
    {
      should: 'return an empty array',
      when: 'no item matches the predicate',
      input: [1, 2, 3],
      predicate: (n) => typeof n === 'number' && n > 100,
      expected: [],
    },
    {
      should: 'preserve the original order of matching items',
      when: 'several items match',
      input: [6, 1, 4, 3, 2],
      predicate: (n) => typeof n === 'number' && n % 2 === 0,
      expected: [6, 4, 2],
    },
  ];

  it.each(testCases)(
    'should $should when $when',
    async ({ predicate, input, expected }) => {
      const result = await drain(filter(predicate)(toAsyncIterable(input)));

      expect(result).toEqual(expected);
    }
  );

  it('should not consume the source until the result is iterated', async () => {
    let pulled = 0;
    async function* tracked() {
      for (const n of [1, 2, 3]) {
        pulled++;
        yield n;
      }
    }

    const filtered = filter<number>(() => true)(tracked());
    expect(pulled).toBe(0);

    await filtered.next();
    expect(pulled).toBe(1);
  });

  it('should stop pulling from the source and close it when the consumer stops early', async () => {
    let pulled = 0;
    let closed = false;
    async function* tracked() {
      try {
        for (const n of [1, 2, 3, 4, 5]) {
          pulled++;
          yield n;
        }
      } finally {
        closed = true;
      }
    }

    for await (const item of filter<number>(() => true)(tracked())) {
      if (item === 2) break;
    }

    expect(pulled).toBe(2);
    expect(closed).toBe(true);
  });

  it('should propagate an error thrown by the predicate', async () => {
    const failing = filter<number>(() => {
      throw new Error('predicate failed');
    });

    await expect(failing(toAsyncIterable([1])).next()).rejects.toThrow(
      'predicate failed'
    );
  });

  it('should propagate an error thrown by the source', async () => {
    async function* broken(): AsyncGenerator<number> {
      yield 1;
      throw new Error('source failed');
    }

    const filtered = filter<number>(() => true)(broken());

    await expect(filtered.next()).resolves.toEqual({ value: 1, done: false });
    await expect(filtered.next()).rejects.toThrow('source failed');
  });
});
