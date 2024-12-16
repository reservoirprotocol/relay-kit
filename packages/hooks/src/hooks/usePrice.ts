import {
  MAINNET_RELAY_API,
  RelayClient,
  type Execute,
  type paths,
  type RelayChain
} from '@reservoir0x/relay-sdk'
import { axiosPostFetcher } from '../fetcher.js'
import {
  useQuery,
  type DefaultError,
  type QueryKey
} from '@tanstack/react-query'
import type { AxiosRequestConfig } from 'axios'

type PriceRequestBody =
  paths['/price']['post']['requestBody']['content']['application/json']

export type PriceResponse =
  paths['/price']['post']['responses']['200']['content']['application/json']

type QueryType = typeof useQuery<
  PriceResponse,
  DefaultError,
  PriceResponse,
  QueryKey
>
type QueryOptions = Parameters<QueryType>['0']

export const queryPrice = function (
  baseApiUrl: string = MAINNET_RELAY_API,
  options?: PriceRequestBody
): Promise<PriceResponse> {
  return new Promise((resolve, reject) => {
    const url = new URL(`${baseApiUrl}/price`)
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

export default function usePrice(
  client?: RelayClient,
  options?: PriceRequestBody,
  onResponse?: (data: Execute) => void,
  queryOptions?: Partial<QueryOptions>
) {
  const response = (useQuery as QueryType)({
    queryKey: ['usePrice', options],
    queryFn: () => {
      return new Promise((resolve, reject) => {
        if (options && client?.source && !options.referrer) {
          options.referrer = client.source
        }
        const promise = queryPrice(client?.baseApiUrl, options)
        promise
          .then((response: any) => {
            resolve(response)
            onResponse?.(response)
          })
          .catch((e) => {
            reject(e)
          })
      })
    },
    enabled: client !== undefined && options !== undefined && (() => {
      if (!client?.chains || !options.originChainId || !options.destinationChainId) {
        return false;
      }
      const fromChain = client.chains.find((chain: RelayChain) => chain.id === options.originChainId);
      const toChain = client.chains.find((chain: RelayChain) => chain.id === options.destinationChainId);
      if (!fromChain?.baseChainId || !toChain?.baseChainId) {
        return true; // If we can't determine baseChainId, allow the request
      }
      return fromChain.id === toChain.baseChainId || toChain.id === fromChain.baseChainId;
    })(),
    retry: false,
    ...queryOptions
  })

  return {
    ...response,
    data: response.error ? undefined : response.data
  }
}
