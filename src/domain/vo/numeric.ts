const DIGITS = /\d+/;

export class Numeric {
  readonly value: number;

  constructor(rawValue: unknown) {
    const numericValue = this.toNumber(rawValue);
    this.value = Number.isFinite(numericValue) ? numericValue : 0;
  }

  private toNumber(rawValue: unknown): number {
    if (typeof rawValue === 'number') {
      return rawValue >= 0 ? rawValue : 0;
    }

    if (typeof rawValue !== 'string') {
      return 0;
    }

    const match = DIGITS.exec(rawValue);
    return match ? Number.parseInt(match[0], 10) : 0;
  }
}
