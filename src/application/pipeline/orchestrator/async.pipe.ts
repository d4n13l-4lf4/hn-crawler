import type { AsyncStep } from '@/application/pipeline/pipeline.types';

export { AsyncStep } from '@/application/pipeline/pipeline.types';

export function pipeAsync<In, Out = In>(
  source: AsyncIterable<In>,
  ...steps: AsyncStep<any, any>[]
): AsyncIterable<Out> {
  return steps.reduce<AsyncIterable<any>>(
    (current, step) => step(current),
    source
  );
}
