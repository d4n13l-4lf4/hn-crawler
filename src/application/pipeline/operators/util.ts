import type { AsyncOperator } from '@/application/pipeline/pipeline.types';

export type { AsyncOperator } from '@/application/pipeline/pipeline.types';

export type AsyncOperatorFactory<In, Out = In> = AsyncOperator<In, Out>;
