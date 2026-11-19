import { AxiosError } from 'axios';
import { createAxiosHttpClient } from './axios';

export class HnHttpClient {
  private readonly http: ReturnType<typeof createAxiosHttpClient>;

  constructor(httpClient: ReturnType<typeof createAxiosHttpClient>) {
    this.http = httpClient;
  }

  async fetchPage(url: string): Promise<string> {
    let response: { data: string };
    try {
      response = await this.http.get<string>(url);
    } catch (error) {
      if (isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response) {
          throw new Error(
            `HTTP ${axiosError.response.status}: ${axiosError.response.statusText}`
          );
        }
        throw new Error(`Failed to fetch page from ${url}`, { cause: error });
      }
      throw new Error(`Failed to fetch page from ${url}`, { cause: error });
    }
    return response.data;
  }
}

function isAxiosError(error: unknown): error is AxiosError {
  return (
    error instanceof Error &&
    'isAxiosError' in error &&
    (error as AxiosError).isAxiosError
  );
}
