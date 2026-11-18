import { describe, expect, it, vi } from 'vitest';
import {
  pipeAsync,
  AsyncStep,
} from '@/application/pipeline/orchestration/pipe';

type AsyncPipeTestCase = {
  should: string;
  when: string;
  steps: AsyncStep<any, any>[];
  expected: any;
  source: any[];
};

describe('Async Pipeline Unit Test', () => {
  const mapAsync = <In, Out>(fn: (value: In) => Out): AsyncStep<In, Out> =>
    async function* (source) {
      for await (const value of source) {
        yield fn(value);
      }
    };

  const collectAsync = <In, Out>(
    fn: (values: In[]) => Out
  ): AsyncStep<In, Out> => {
    return async function* (source) {
      const values: In[] = [];

      for await (const value of source) {
        values.push(value);
      }

      yield fn(values);
    };
  };

  const multiplier = vi.fn((value: number) => value * 2);
  const stringifier = vi.fn(
    (values: number[]) => `Hello there! ${values.join(', ')}`
  );

  const testCases: AsyncPipeTestCase[] = [
    {
      should: 'return the initial value when there are no functions',
      when: 'no functions are provided',
      expected: [7],
      source: [7],
      steps: [],
    },
    {
      should: 'apply the functions in order',
      when: 'functions are provided',
      source: [1, 2],
      expected: ['Hello there! 2, 4'],
      steps: [mapAsync(multiplier), collectAsync(stringifier)],
    },
  ];

  it.each(testCases)(
    '$should when $when',
    async ({ source, expected, steps }) => {
      const pipeline = pipeAsync(source, ...steps);
      const result: any[] = [];

      for await (const value of pipeline) {
        result.push(value);
      }

      expect(result).toStrictEqual(expected);
    }
  );
});
