export type AsyncStep<In, Out> = (
  source: AsyncIterable<In>
) => AsyncGenerator<Out>;

export type AsyncOperator<In, Out = In> = AsyncStep<In, Out>;
