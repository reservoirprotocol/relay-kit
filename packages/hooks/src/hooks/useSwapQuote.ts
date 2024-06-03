import { RelayClient, type paths } from '@reservoir0x/relay-sdk'
import { useMemo } from 'react'
import { axiosPostFetcher } from '../fetcher'
import {
  useQuery,
  type DefaultError,
  type QueryKey
} from '@tanstack/react-query'

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

export default function (
  client?: RelayClient,
  options?: ExecuteSwapBody,
  onRequest?: () => void,
  onResponse?: (data: ExecuteSwapResponse) => void,
  queryOptions?: Partial<QueryOptions>
) {
  const url = new URL(`${client?.baseApiUrl}/execute/swap`)
  const swapOptions = { ...options, source: 'relay.link' }

  const response = (useQuery as QueryType)({
    queryKey: ['useSwapQuote', options],
    queryFn: () => {
      onRequest?.()
      const promise = axiosPostFetcher(url.href, swapOptions)
      promise.then((response: any) => {
        onResponse?.(response)
      })
      return promise
    },
    enabled: client !== undefined && options !== undefined,
    ...queryOptions
  })

  return useMemo(() => {
    return {
      ...response,
      data: response.error ? undefined : response.data
    }
  }, [response])
}
