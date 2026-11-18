export class Title {
  readonly value: string;

  constructor(rawValue: unknown) {
    this.value =
      typeof rawValue === 'string' ? rawValue.replace(/\s+/g, ' ').trim() : '';
  }
}
