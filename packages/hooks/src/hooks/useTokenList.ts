import { axiosPostFetcher } from '../fetcher'
import { useMemo } from 'react'
import { type paths } from '@reservoir0x/relay-sdk'
import {
  useQuery,
  type DefaultError,
  type QueryKey
} from '@tanstack/react-query'

export type GetCurrenciesBody = NonNullable<
  paths['/currencies/v1']['post']['requestBody']
>['content']['application/json']
export type GetCurrenciesResponse =
  paths['/currencies/v1']['post']['responses']['200']['content']['application/json']
export type CurrencyList = GetCurrenciesResponse[0]
export type Currency = GetCurrenciesResponse[0][0]
type QueryType = typeof useQuery<
  GetCurrenciesResponse,
  DefaultError,
  GetCurrenciesResponse,
  QueryKey
>
type QueryOptions = Parameters<QueryType>['0']

export default function (
  baseApiUrl?: string,
  options?: GetCurrenciesBody,
  queryOptions?: Partial<QueryOptions>
) {
  const url = new URL(`${baseApiUrl}/currencies/v1`)
  const response = (useQuery as QueryType)({
    queryKey: ['useTokenList', options],
    queryFn: () => {
      return axiosPostFetcher(url.href, options)
    },
    enabled: baseApiUrl && options ? true : false,
    retry: false,
    ...queryOptions
  })

  return useMemo(() => {
    return {
      ...response,
      data: response.error ? undefined : response.data
    } as Omit<ReturnType<QueryType>, 'data'> & {
      data?: GetCurrenciesResponse
    }
  }, [response.data, response.error])
}
