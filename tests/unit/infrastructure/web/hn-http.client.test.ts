import { describe, expect, it, vi } from 'vitest';
import { AxiosError } from 'axios';
import { HnHttpClient } from '@/infrastructure/web/hn-http.client';

describe('HN HTTP client unit test', () => {
  const testCases: Array<{
    should: string;
    when: string;
    axiosInstance: Record<string, unknown>;
    pageNumber: number;
    expected: string;
  }> = [
    {
      should: 'return the response body for a successful request',
      when: 'the axios instance returns a successful response',
      axiosInstance: {
        get: vi.fn().mockResolvedValue({ data: '<html>Hacker News</html>' }),
      },
      pageNumber: 1,
      expected: '<html>Hacker News</html>',
    },
    {
      should: 'return an empty string for a successful empty response',
      when: 'the axios instance returns an empty response',
      axiosInstance: {
        get: vi.fn().mockResolvedValue({ data: '' }),
      },
      pageNumber: 1,
      expected: '',
    },
  ];

  it.each(testCases)(
    'should $should when $when',
    async ({ axiosInstance, pageNumber, expected }) => {
      const client = new HnHttpClient(axiosInstance as never);
      await expect(client.fetchPage(pageNumber)).resolves.toBe(expected);
      expect(axiosInstance.get).toHaveBeenCalledWith('', {
        params: { p: pageNumber },
      });
    }
  );

  it.each([
    { status: 404, statusText: 'Not Found' },
    { status: 503, statusText: 'Service Unavailable' },
  ])(
    'should reject an HTTP $status response with status context',
    async ({ status, statusText }) => {
      const axiosError = new Error(
        `Request failed with status code ${status}`
      ) as AxiosError;
      axiosError.isAxiosError = true;
      axiosError.response = { status, statusText } as any;
      const axiosInstance = {
        get: vi.fn().mockRejectedValue(axiosError),
      };
      const client = new HnHttpClient(axiosInstance as never);

      await expect(client.fetchPage(1)).rejects.toThrow(
        `HTTP ${status}: ${statusText}`
      );
    }
  );

  it('should retain the original error as the cause when the request fails', async () => {
    const cause = new Error('network unavailable');
    const axiosInstance = {
      get: vi.fn().mockRejectedValue(cause),
    };
    const client = new HnHttpClient(axiosInstance as never);

    let caughtError: unknown;
    try {
      await client.fetchPage(2);
    } catch (error) {
      caughtError = error;
    }

    expect(caughtError).toBeInstanceOf(Error);
    expect(caughtError).toMatchObject({
      message: 'Failed to fetch page 2',
      cause,
    });
  });

  it('should wrap an AxiosError without a response as a fetch failure', async () => {
    const axiosError = new Error('Axios error without response') as AxiosError;
    axiosError.isAxiosError = true;
    axiosError.response = undefined;
    const axiosInstance = {
      get: vi.fn().mockRejectedValue(axiosError),
    };
    const client = new HnHttpClient(axiosInstance as never);

    await expect(client.fetchPage(3)).rejects.toThrow('Failed to fetch page 3');
  });

  it('should be constructed with an axios instance', () => {
    const axiosInstance = { get: vi.fn() };
    const client = new HnHttpClient(axiosInstance as never);
    expect(client).toBeInstanceOf(HnHttpClient);
  });
});
