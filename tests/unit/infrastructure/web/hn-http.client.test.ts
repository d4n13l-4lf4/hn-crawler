import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchPage } from '@/infrastructure/web/hn-http.client';

describe('HN HTTP client unit test', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should return the response body for a successful request', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response('<html>Hacker News</html>', { status: 200 })
      );
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchPage('https://example.com/news')).resolves.toBe(
      '<html>Hacker News</html>'
    );
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith('https://example.com/news');
  });

  it('should return an empty string for a successful empty response', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response('', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchPage('https://example.com/news')).resolves.toBe('');
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith('https://example.com/news');
  });

  it.each([
    { status: 404, statusText: 'Not Found' },
    { status: 503, statusText: 'Service Unavailable' },
  ])(
    'should reject an HTTP $status response with status context',
    async ({ status, statusText }) => {
      const fetchMock = vi
        .fn()
        .mockResolvedValue(new Response('', { status, statusText }));
      vi.stubGlobal('fetch', fetchMock);

      await expect(fetchPage('https://example.com/news')).rejects.toThrow(
        `HTTP ${status}: ${statusText}`
      );
      expect(fetchMock).toHaveBeenCalledOnce();
      expect(fetchMock).toHaveBeenCalledWith('https://example.com/news');
    }
  );

  it.each([
    {
      should: 'retain the original network error as the cause',
      error: new TypeError('network unavailable'),
    },
    {
      should: 'retain a non-Error rejection as the cause',
      error: 'connection refused',
    },
  ])('should $should when fetch rejects', async ({ error: cause }) => {
    const fetchMock = vi.fn().mockRejectedValue(cause);
    vi.stubGlobal('fetch', fetchMock);

    let caughtError: unknown;
    try {
      await fetchPage('https://example.com/news');
    } catch (error) {
      caughtError = error;
    }

    expect(caughtError).toBeInstanceOf(Error);
    expect(caughtError).toMatchObject({
      message: 'Failed to fetch page from https://example.com/news',
      cause,
    });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith('https://example.com/news');
  });
});
