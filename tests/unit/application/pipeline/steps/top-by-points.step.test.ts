import { describe, expect, it } from 'vitest';
import type { HnEntry } from '../../../../../src/domain/models';
import { topByPointsStep } from '../../../../../src/application/pipeline/steps/top-by-points.step';

describe('topByPointsStep', () => {
  it('returns the input entries unchanged until sorting is implemented', () => {
    const entries: HnEntry[] = [];
    expect(topByPointsStep(entries)).toBe(entries);
  });
});
