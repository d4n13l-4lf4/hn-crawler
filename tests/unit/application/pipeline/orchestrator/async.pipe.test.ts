import { describe, expect, it, vi } from 'vitest';
import {
  AsyncStep,
  pipeAsync,
} from '@/application/pipeline/orchestrator/async.pipe';
import { drain } from '../../../../helpers/async';

type AsyncPipeTestCase = {
  should: string;
  when: string;
  source: AsyncIterable<number>;
  steps: AsyncStep<number, number>[];
  expected: number[];
};

describe('Async Pipe Unit Test', () => {
  const map = (fn: (value: number) => number): AsyncStep<number, number> =>
    async function* (source) {
      for await (const value of source) yield fn(value);
    };

  async function* from(values: number[]): AsyncGenerator<number> {
    yield* values;
  }

  const first = vi.fn((value: number) => value * 2);
  const second = vi.fn((value: number) => value + 1);
  const testCases: AsyncPipeTestCase[] = [
    {
      should: 'pass values through unchanged',
      when: 'no steps are supplied',
      source: from([1, 2]),
      steps: [],
      expected: [1, 2],
    },
    {
      should: 'apply each step in sequence',
      when: 'multiple steps are supplied',
      source: from([1, 2]),
      steps: [map(first), map(second)],
      expected: [3, 5],
    },
    {
      should: 'return no values',
      when: 'the async source is empty',
      source: from([]),
      steps: [map((value) => value)],
      expected: [],
    },
  ];

  it.each(testCases)(
    'should $should when $when',
    async ({ source, steps, expected }) => {
      const result = await drain(pipeAsync(source, ...steps));
      expect(result).toEqual(expected);
    }
  );

  it('should propagate an error from the source', async () => {
    async function* broken(): AsyncGenerator<number> {
      yield 1;
      throw new Error('source failed');
    }

    await expect(drain(pipeAsync(broken()))).rejects.toThrow('source failed');
  });

  it('should propagate an error from a step', async () => {
    const broken: AsyncStep<number, number> = async function* () {
      throw new Error('step failed');
    };

    await expect(drain(pipeAsync(from([1]), broken))).rejects.toThrow(
      'step failed'
    );
  });
});
