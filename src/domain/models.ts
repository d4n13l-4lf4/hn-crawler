// Domain models for the Hacker News Crawler

export interface HnEntry {
  number: number;
  title: string;
  points: number;
  comments: number;
}
