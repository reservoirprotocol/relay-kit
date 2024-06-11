import {
  MAINNET_RELAY_API,
  RelayClient,
  type AdaptedWallet,
  type Execute,
  type paths,
  type ProgressData
} from '@reservoir0x/relay-sdk'
import { axiosPostFetcher } from '../fetcher'
import {
  useQuery,
  type DefaultError,
  type QueryKey
} from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import type { WalletClient } from 'viem'

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

type onProgress = (data: ProgressData) => void

export default function (
  client?: RelayClient,
  wallet?: WalletClient | AdaptedWallet,
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

  const swap = useCallback(
    (onProgress: onProgress) => {
      if (!wallet) {
        throw 'Missing a valid wallet'
      }

      if (!response.data) {
        throw 'Missing a quote'
      }

      return client?.actions?.execute({
        wallet,
        quote: response.data as Execute,
        onProgress
      })
    },
    [response.data, wallet, client]
  )

  return useMemo(
    () =>
      ({
        ...response,
        data: response.error ? undefined : response.data,
        swap
      } as Omit<ReturnType<QueryType>, 'data'> & {
        data?: ExecuteSwapResponse
        swap: (onProgress: onProgress) => Promise<Execute> | undefined
      }),
    [response.data, response.error, response.isLoading, swap]
  )
}
