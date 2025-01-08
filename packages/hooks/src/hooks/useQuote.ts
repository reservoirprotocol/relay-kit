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

type QuoteBody =
  paths['/quote']['post']['requestBody']['content']['application/json']

export type QuoteResponse =
  paths['/quote']['post']['responses']['200']['content']['application/json']

type QueryType = typeof useQuery<
  QuoteResponse,
  DefaultError,
  QuoteResponse,
  QueryKey
>
type QueryOptions = Parameters<QueryType>['0']

export const queryQuote = function (
  baseApiUrl: string = MAINNET_RELAY_API,
  options?: QuoteBody
): Promise<Execute> {
  return new Promise((resolve, reject) => {
    const url = new URL(`${baseApiUrl}/quote`)
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

export type onProgress = (data: ProgressData) => void

export default function (
  client?: RelayClient,
  wallet?: WalletClient | AdaptedWallet,
  options?: QuoteBody,
  onRequest?: () => void,
  onResponse?: (data: Execute) => void,
  queryOptions?: Partial<QueryOptions>,
  onError?: (e: any) => void
) {
  const queryKey = ['useQuote', options]
  const response = (useQuery as QueryType)({
    queryKey: queryKey,
    queryFn: () => {
      onRequest?.()
      if (options && client?.source && !options.referrer) {
        options.referrer = client.source
      }
      const promise = queryQuote(client?.baseApiUrl, options)
      promise
        .then((response: any) => {
          onResponse?.(response)
        })
        .catch((e) => {
          onError?.(e)
          throw e
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

      return promise
    },
    [response.data, wallet, client]
  )

  return useMemo(
    () =>
      ({
        ...response,
        data: response.error ? undefined : response.data,
        queryKey,
        executeQuote
      }) as Omit<ReturnType<QueryType>, 'data'> & {
        data?: QuoteResponse
        queryKey: QueryKey
        executeQuote: (onProgress: onProgress) => Promise<Execute> | undefined
      },
    [
      response.data,
      response.error,
      response.isLoading,
      response.isFetching,
      response.isRefetching,
      response.dataUpdatedAt,
      executeQuote,
      queryKey
    ]
  )
}
