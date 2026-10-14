/**
 * Helpers for tests that answer the app's HTTP requests by hand, to check a
 * screen's states in order (docs/testing.md#network).
 */
import {
  AxiosError,
  AxiosHeaders,
  type AxiosAdapter,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { api } from '@/shared/http/api';

export interface HeldRequest {
  config: InternalAxiosRequestConfig;
  resolve: (response: AxiosResponse) => void;
  reject: (error: unknown) => void;
}

/**
 * Replaces the client's adapter (the app's `api` by default): each request
 * waits in the returned list until the test answers it. Restore the adapter
 * after the test (`client.defaults.adapter = original`).
 */
export function holdRequests(client: AxiosInstance = api): HeldRequest[] {
  const held: HeldRequest[] = [];
  client.defaults.adapter = (config =>
    new Promise((resolve, reject) =>
      held.push({ config, resolve, reject })
    )) as AxiosAdapter;
  return held;
}

/** A 200 response with `data`, for `request.resolve(...)`. */
export function ok(
  config: InternalAxiosRequestConfig,
  data: unknown
): AxiosResponse {
  return { data, status: 200, statusText: 'OK', headers: {}, config };
}

/** An HTTP error with `status` and a body, for `request.reject(...)`. */
export function httpError(
  config: InternalAxiosRequestConfig,
  status: number,
  data: unknown = {}
): AxiosError {
  return new AxiosError(
    `Request failed with status code ${status}`,
    status >= 500 ? 'ERR_BAD_RESPONSE' : 'ERR_BAD_REQUEST',
    config,
    null,
    {
      data,
      status,
      statusText: String(status),
      headers: new AxiosHeaders(),
      config,
    }
  );
}
