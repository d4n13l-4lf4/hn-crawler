import { describe, expect, it, vi } from 'vitest';
import { pipe } from '../../../../src/application/pipeline/pipe';

describe('pipe', () => {
  it('returns the initial value when there are no functions', () => {
    expect(pipe(7)).toBe(7);
  });

  it('applies functions in order', () => {
    const first = vi.fn((value: number) => value + 2);
    const second = vi.fn((value: number) => value * 3);

    expect(pipe(4, first, second)).toBe(18);
    expect(first).toHaveBeenCalledWith(4);
    expect(second).toHaveBeenCalledWith(6);
  });
});
