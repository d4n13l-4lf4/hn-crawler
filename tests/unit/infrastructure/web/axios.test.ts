import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAxiosHttpClient } from '@/infrastructure/web/axios';

let responseFulfilledInterceptor: ((response: unknown) => unknown) | undefined;
let responseInterceptor: ((error: unknown) => unknown) | undefined;

vi.mock('axios', async (importOriginal) => {
  const actual: Record<string, unknown> = await importOriginal();
  return {
    ...actual,
    default: {
      ...(actual.default as Record<string, unknown>),
      create: vi.fn(() => {
        const instance: Record<string, unknown> = {
          interceptors: {
            response: {
              use: vi.fn((onFulfilled, onRejected) => {
                responseFulfilledInterceptor = onFulfilled as unknown as (
                  response: unknown
                ) => unknown;
                responseInterceptor = onRejected as unknown as (
                  error: unknown
                ) => unknown;
              }),
            },
            request: {
              use: vi.fn(),
            },
          },
          get: vi.fn(),
          post: vi.fn(),
          request: vi
            .fn()
            .mockImplementation(async () => ({ data: 'success' })),
        };
        return instance;
      }),
    },
  };
});

import axios from 'axios';

type AxiosTestCase = {
  should: string;
  when: string;
  input: {
    baseURL: string;
    timeout: number;
    maxRetries: number;
    retryDelay: number;
  };
  expected: { createCalled: boolean; baseURL: string; timeout: number };
};

describe('Axios HTTP client builder unit test', () => {
  const testCases: AxiosTestCase[] = [
    {
      should: 'create an axios instance bound to the provided base URL',
      when: 'the builder receives a baseURL, timeout, max retries, and retry delay',
      input: {
        baseURL: 'https://news.ycombinator.com/',
        timeout: 15000,
        maxRetries: 3,
        retryDelay: 3000,
      },
      expected: {
        createCalled: true,
        baseURL: 'https://news.ycombinator.com/',
        timeout: 15000,
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    responseFulfilledInterceptor = undefined;
    responseInterceptor = undefined;
  });

  it.each(testCases)('should $should when $when', ({ input, expected }) => {
    const instance = createAxiosHttpClient(input);
    expect(instance).toBeDefined();
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: expected.baseURL,
        timeout: expected.timeout,
      })
    );
  });

  it('should attach a response interceptor for server-error retries', () => {
    createAxiosHttpClient({
      baseURL: 'https://news.ycombinator.com/',
      timeout: 15000,
      maxRetries: 3,
      retryDelay: 3000,
    });
    expect(responseInterceptor).toBeDefined();
    expect(responseFulfilledInterceptor).toBeDefined();
  });

  it('should pass successful responses through the fulfilled interceptor', () => {
    createAxiosHttpClient({
      baseURL: 'https://news.ycombinator.com/',
      timeout: 15000,
      maxRetries: 3,
      retryDelay: 3000,
    });
    const response = { data: 'success' };
    expect(responseFulfilledInterceptor!(response)).toEqual(response);
  });

  it('should retry server errors (5xx) up to maxRetries with retryDelay', async () => {
    createAxiosHttpClient({
      baseURL: 'https://news.ycombinator.com/',
      timeout: 15000,
      maxRetries: 3,
      retryDelay: 0,
    });

    const interceptor = responseInterceptor;
    expect(interceptor).toBeDefined();

    // First call: 503 error, should retry (retryCount 0 -> 1)
    const error503a: any = new Error('Server error');
    error503a.isAxiosError = true;
    error503a.response = { status: 503, statusText: 'Service Unavailable' };
    error503a.config = { _retryCount: 0 };

    try {
      await interceptor!(error503a);
    } catch {
      // expected - will retry
    }

    // Second call: 503 error again, should retry again (maxRetries=3, retryCount 1 -> 2)
    const error503b: any = new Error('Server error');
    error503b.isAxiosError = true;
    error503b.response = { status: 503, statusText: 'Service Unavailable' };
    error503b.config = { _retryCount: 1 };

    try {
      await interceptor!(error503b);
    } catch {
      // expected - will retry again
    }

    // Third call: success - response with data (retryCount 2 < maxRetries 3)
    const error503c: any = new Error('Server error');
    error503c.isAxiosError = true;
    error503c.response = { status: 503, statusText: 'Service Unavailable' };
    error503c.config = { _retryCount: 2 };
    error503c.response.data = 'success';

    const result = await interceptor!(error503c as any);
    expect(result).toEqual({ data: 'success' });
  });

  it('should not retry non-server errors (4xx)', async () => {
    createAxiosHttpClient({
      baseURL: 'https://news.ycombinator.com/',
      timeout: 15000,
      maxRetries: 3,
      retryDelay: 0,
    });

    const clientError: any = new Error('Client error');
    clientError.isAxiosError = true;
    clientError.response = { status: 404, statusText: 'Not Found' };

    const interceptor = responseInterceptor;
    expect(interceptor).toBeDefined();

    await expect(interceptor!(clientError)).rejects.toMatchObject({
      response: { status: 404 },
    });
  });

  it('should throw after maxRetries exceeded for server errors', async () => {
    createAxiosHttpClient({
      baseURL: 'https://news.ycombinator.com/',
      timeout: 15000,
      maxRetries: 1,
      retryDelay: 0,
    });

    const serverError: any = new Error('Server error');
    serverError.isAxiosError = true;
    serverError.response = { status: 500, statusText: 'Internal Server Error' };

    const interceptor = responseInterceptor;
    expect(interceptor).toBeDefined();

    // First call: 500 error, should retry (retryCount 0 -> 1)
    serverError.config = { _retryCount: 0 };
    try {
      await interceptor!(serverError);
    } catch {
      // expected - will retry
    }

    // Second call: 500 error again, maxRetries=1 exceeded, should throw
    serverError.config = { _retryCount: 1 };
    await expect(interceptor!(serverError)).rejects.toMatchObject({
      response: { status: 500 },
    });
  });

  it('should treat an AxiosError without a response as non-server-error', async () => {
    createAxiosHttpClient({
      baseURL: 'https://news.ycombinator.com/',
      timeout: 15000,
      maxRetries: 3,
      retryDelay: 0,
    });

    const networkError: any = new Error('Network error');
    networkError.isAxiosError = true;
    networkError.response = undefined;

    const interceptor = responseInterceptor;
    expect(interceptor).toBeDefined();

    await expect(interceptor!(networkError)).rejects.toBe(networkError);
  });

  it('should initialize retry count to 0 when _retryCount is undefined', async () => {
    createAxiosHttpClient({
      baseURL: 'https://news.ycombinator.com/',
      timeout: 15000,
      maxRetries: 1,
      retryDelay: 0,
    });

    const serverError: any = new Error('Server error');
    serverError.isAxiosError = true;
    serverError.response = { status: 500, statusText: 'Internal Server Error' };
    serverError.config = {};

    const interceptor = responseInterceptor;
    expect(interceptor).toBeDefined();

    // First call: 500 error with no _retryCount → should retry (undefined ?? 0 → 0, then increment to 1)
    try {
      await interceptor!(serverError);
    } catch {
      // expected - will retry
    }

    // Second call: 500 error again with _retryCount=1 → maxRetries=1 exceeded → throw
    serverError.config = { _retryCount: 1 };
    await expect(interceptor!(serverError)).rejects.toMatchObject({
      response: { status: 500 },
    });
  });
});
