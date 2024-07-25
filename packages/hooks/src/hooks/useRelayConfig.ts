import {
  MAINNET_RELAY_API,
  RelayClient,
  setParams,
  type paths
} from '@reservoir0x/relay-sdk'
import fetcher from '../fetcher.js'
import {
  useQuery,
  type DefaultError,
  type QueryKey
} from '@tanstack/react-query'
import { useMemo } from 'react'

type ConfigQuery = paths['/config/v2']['get']['parameters']['query']

export type ConfigResponse =
  paths['/config/v2']['get']['responses']['200']['content']['application/json']

type QueryType = typeof useQuery<
  ConfigResponse,
  DefaultError,
  ConfigResponse,
  QueryKey
>
type QueryOptions = Parameters<QueryType>['0']

export const queryRelayConfig = function (
  baseApiUrl: string = MAINNET_RELAY_API,
  options?: ConfigQuery
): Promise<ConfigResponse> {
  const url = new URL(`${baseApiUrl}/config/v2`)
  setParams(url, options ?? {})
  return fetcher(url.href)
}

export default function (
  client?: RelayClient,
  options?: ConfigQuery,
  queryOptions?: Partial<QueryOptions>
) {
  const response = (useQuery as QueryType)({
    queryKey: ['useRelayConfig', options],
    queryFn: () => queryRelayConfig(client?.baseApiUrl, options),
    retry: false,
    enabled: client !== undefined && options !== undefined,
    ...queryOptions
  })

  return useMemo(() => {
    return {
      ...response
    } as ReturnType<QueryType>
  }, [response.data, response.error, response.isLoading])
}
