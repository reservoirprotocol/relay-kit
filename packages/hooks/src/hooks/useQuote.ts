import {
  MAINNET_RELAY_API,
  RelayClient,
  type AdaptedWallet,
  type Execute,
  type paths,
  type ProgressData
} from '@reservoir0x/relay-sdk'
import { axiosPostFetcher } from '../fetcher.js'
import {
  useQuery,
  type DefaultError,
  type QueryKey
} from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import type { WalletClient } from 'viem'
import type { AxiosRequestConfig } from 'axios'

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

export const queryQuote = function (
  baseApiUrl: string = MAINNET_RELAY_API,
  options?: ExecuteSwapBody
): Promise<Execute> {
  return new Promise((resolve, reject) => {
    const url = new URL(`${baseApiUrl}/execute/swap`)
    axiosPostFetcher(url.href, options)
      .then((response) => {
        const request: AxiosRequestConfig = {
          url: url.href,
          method: 'post',
          data: options
        }
        resolve({
          ...response,
          request
        })
      })
      .catch((e) => {
        reject(e)
      })
  })
}

type onProgress = (data: ProgressData) => void

export default function (
  client?: RelayClient,
  wallet?: WalletClient | AdaptedWallet,
  options?: ExecuteSwapBody,
  onRequest?: () => void,
  onResponse?: (data: Execute) => void,
  queryOptions?: Partial<QueryOptions>
) {
  const response = (useQuery as QueryType)({
    queryKey: ['useQuote', options],
    queryFn: () => {
      onRequest?.()
      const promise = queryQuote(client?.baseApiUrl, options)
      promise.then((response: any) => {
        onResponse?.(response)
      })
      return promise
    },
    enabled: client !== undefined && options !== undefined,
    retry: false,
    ...queryOptions
  })

  const executeQuote = useCallback(
    (onProgress: onProgress) => {
      if (!wallet) {
        throw 'Missing a valid wallet'
      }

      if (!response.data) {
        throw 'Missing a quote'
      }

      const promise = client?.actions?.execute({
        wallet,
        quote: response.data as Execute,
        onProgress
      })

      promise?.then(() => {
        response.refetch()
      })

      return promise
    },
    [response.data, wallet, client]
  )

  return useMemo(
    () =>
      ({
        ...response,
        data: response.error ? undefined : response.data,
        executeQuote
      }) as Omit<ReturnType<QueryType>, 'data'> & {
        data?: ExecuteSwapResponse
        executeQuote: (onProgress: onProgress) => Promise<Execute> | undefined
      },
    [response.data, response.error, response.isLoading, executeQuote]
  )
}
