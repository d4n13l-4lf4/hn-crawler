import { Numeric } from '@/domain/vo/numeric';
import { Title } from '@/domain/vo/title';

export class HNEntry {
  readonly rank: Numeric;
  readonly title: Title;
  readonly points: Numeric;
  readonly number_of_comments: Numeric;

  constructor(
    rank: unknown,
    title: unknown,
    points: unknown,
    number_of_comments: unknown
  ) {
    this.rank = new Numeric(rank);
    this.title = new Title(title);
    this.points = new Numeric(points);
    this.number_of_comments = new Numeric(number_of_comments);
  }
}
