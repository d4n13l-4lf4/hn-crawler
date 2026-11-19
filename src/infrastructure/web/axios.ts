import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

export type AxiosHttpClientConfig = {
  baseURL: string;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
};

const isServerError = (error: AxiosError): boolean => {
  if (!error.response) {
    return false;
  }
  return error.response.status >= 500;
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export function createAxiosHttpClient({
  baseURL,
  timeout,
  maxRetries,
  retryDelay,
}: AxiosHttpClientConfig) {
  const instance = axios.create({
    baseURL,
    timeout,
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const config = error.config as InternalAxiosRequestConfig & {
        _retryCount?: number;
      };

      if (!isServerError(error)) {
        throw error;
      }

      config._retryCount = config._retryCount ?? 0;

      if (config._retryCount >= maxRetries) {
        throw error;
      }

      config._retryCount += 1;

      await sleep(retryDelay);

      return instance.request(config);
    }
  );

  return instance;
}
