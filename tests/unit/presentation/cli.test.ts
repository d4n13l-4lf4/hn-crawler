import { describe, it, expect, vi } from 'vitest';
import { createCli } from '../../../src/presentation/cli';
import { CrawlHnUseCase } from '../../../src/application/crawl-hn.use-case';

vi.mock('../../../src/application/crawl-hn.use-case');

describe('CLI Command', () => {
  it('should output "Hello World" when executed with no arguments', async () => {
    const mockUseCase = new CrawlHnUseCase({} as any, {} as any);
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const cli = createCli(mockUseCase);

    try {
      cli.parse(['node', 'main.js'], { from: 'user' });
      expect(spy).toHaveBeenCalledWith('Hello World');
    } finally {
      spy.mockRestore();
    }
  });
});
