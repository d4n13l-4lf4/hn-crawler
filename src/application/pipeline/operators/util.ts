export type AsyncOperator<In, Out = In> = (
  source: AsyncIterable<In>
) => AsyncGenerator<Out>;
