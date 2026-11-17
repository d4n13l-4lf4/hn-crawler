// Text utility functions for the Hacker News Crawler

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
