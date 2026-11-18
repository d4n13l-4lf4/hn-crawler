export class HNEntry {
  constructor(
    public readonly rank: number,
    public readonly title: string,
    public readonly points: number,
    public readonly number_of_comments: number
  ) {}
}
