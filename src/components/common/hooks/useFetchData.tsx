import useSWR from 'swr';

import request, { RequestOptions } from '../../../api/fetcher';

function fetcher<T>(requestOption?: RequestOptions) {
  return (url: string) => request(url, requestOption).then((data) => data as T);
}

export default function useFetchData<T = unknown>(url: string, options?: RequestOptions) {
  const { data, error } = useSWR(url, fetcher<T>(options), { shouldRetryOnError: false });
  return {
    data,
    loading: !error && !data,
    error: error,
  };
}
