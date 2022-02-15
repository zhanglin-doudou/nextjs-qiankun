import fetch from 'isomorphic-unfetch';
import { omitBy } from 'lodash';
import qs from 'query-string';

import { AnyMap } from '../types/common';

export enum EHttpMethods {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

function omitFilter(a: unknown) {
  return a === '' || a === null || a === undefined;
}

export interface ResponseData<T = unknown> {
  code: number;
  data: T;
  message: string;
}
export interface RequestOptions {
  headers?: HeadersInit;
  signal?: AbortSignal;
  method?: EHttpMethods;
  query?: AnyMap;
  data?: AnyMap;
  body?: string;
  timeout?: number;
  credentials?: 'include' | 'same-origin';
  mode?: 'cors' | 'same-origin';
  cache?: 'no-cache' | 'default' | 'force-cache';
}

/**
 * Http request
 * @param url request URL
 * @param options request options
 */
interface IHttpInterface {
  request<T = ResponseData>(url: string, options?: RequestOptions): Promise<T | undefined>;
}

const CAN_SEND_METHOD = ['POST', 'PUT', 'PATCH', 'DELETE'];

class Http implements IHttpInterface {
  public async request<T>(
    url: string,
    options?: RequestOptions,
    abortController?: AbortController
  ): Promise<T | undefined> {
    const opts: RequestOptions = Object.assign(
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        credentials: 'include',
        timeout: 10000,
        mode: 'cors',
        cache: 'no-cache',
      },
      options
    );

    abortController && (opts.signal = abortController.signal);

    if (opts && opts.query) {
      url += `${url.includes('?') ? '&' : '?'}${qs.stringify(omitBy(opts.query, omitFilter))}`;
    }

    const canSend = opts && opts.method && CAN_SEND_METHOD.includes(opts.method);

    if (canSend && opts.data) {
      opts.body = JSON.stringify(omitBy(opts.data, omitFilter));
      opts.headers && Reflect.set(opts.headers, 'Content-Type', 'application/json');
    }

    try {
      const res = await Promise.race([
        fetch(url, opts),
        new Promise<Response>((_, reject) => {
          setTimeout(() => {
            return reject({
              message: '请求超时，请稍后重试',
              url,
            });
          }, opts.timeout);
        }),
      ]);
      const result = await res.json();
      if (res.status !== 200) {
        throw new Error(result?.message || '服务器内部错误');
      }
      return result;
    } catch (e) {
      typeof window !== 'undefined' && console.error({ content: (e as Error).message });
      // throw to swr
      throw e;
    }
  }
}

const { request } = new Http();

export { request as default };
