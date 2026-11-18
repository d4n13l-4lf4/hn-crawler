import { describe, expect, it, vi } from 'vitest';
import { CrawlerPort } from '../../../src/application/ports/in/crawler.port';
import { createCli } from '../../../src/presentation/cli';

describe('CLI command', () => {
  it('should output "Hello World" when executed with no arguments', () => {
    const crawler: CrawlerPort = { execute: vi.fn().mockResolvedValue([]) };
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const cli = createCli(crawler);

    try {
      cli.parse(['node', 'main.js'], { from: 'user' });
      expect(log).toHaveBeenCalledWith('Hello World');
      expect(crawler.execute).not.toHaveBeenCalled();
    } finally {
      log.mockRestore();
    }
  });
});
