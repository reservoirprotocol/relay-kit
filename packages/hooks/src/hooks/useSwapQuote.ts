import {
  MAINNET_RELAY_API,
  RelayClient,
  type paths
} from '@reservoir0x/relay-sdk'
import { axiosPostFetcher } from '../fetcher'
import {
  useQuery,
  type DefaultError,
  type QueryKey
} from '@tanstack/react-query'
import { useMemo } from 'react'

type ExecuteSwapBody =
  paths['/execute/swap']['post']['requestBody']['content']['application/json']

export type ExecuteSwapResponse =
  paths['/execute/swap']['post']['responses']['200']['content']['application/json']

type QueryType = typeof useQuery<
  ExecuteSwapResponse,
  DefaultError,
  ExecuteSwapResponse,
  QueryKey
>
type QueryOptions = Parameters<QueryType>['0']

export const querySwapQuote = function (
  baseApiUrl: string = MAINNET_RELAY_API,
  options?: ExecuteSwapBody
): Promise<ExecuteSwapResponse> {
  const url = new URL(`${baseApiUrl}/execute/swap`)
  return axiosPostFetcher(url.href, options)
}

export default function (
  client?: RelayClient,
  options?: ExecuteSwapBody,
  onRequest?: () => void,
  onResponse?: (data: ExecuteSwapResponse) => void,
  queryOptions?: Partial<QueryOptions>
) {
  const response = (useQuery as QueryType)({
    queryKey: ['useSwapQuote', options],
    queryFn: () => {
      onRequest?.()
      const promise = querySwapQuote(client?.baseApiUrl, options)
      promise.then((response: any) => {
        onResponse?.(response)
      })
      return promise
    },
    enabled: client !== undefined && options !== undefined,
    retry: false,
    ...queryOptions
  })

  return useMemo(
    () =>
      ({
        ...response,
        data: response.error ? undefined : response.data
      }) as Omit<ReturnType<QueryType>, 'data'> & {
        data?: ExecuteSwapResponse
      },
    [response.data, response.error]
  )
}
