import {
  configureViemChain,
  convertViemChainToRelayChain,
  setParams,
  type paths
} from '@reservoir0x/relay-sdk'
import fetcher from '../fetcher'
import {
  useQuery,
  type DefaultError,
  type QueryKey
} from '@tanstack/react-query'
import { useMemo } from 'react'
import { mainnet } from 'viem/chains'

type ChainsQuery = paths['/chains']['get']['parameters']['query']

export type ChainsResponse =
  paths['/chains']['get']['responses']['200']['content']['application/json']

type QueryType = typeof useQuery<
  ChainsResponse,
  DefaultError,
  ChainsResponse,
  QueryKey
>
type QueryOptions = Parameters<QueryType>['0']

export default function (
  baseApiUrl?: string,
  options?: ChainsQuery,
  queryOptions?: Partial<QueryOptions>
) {
  const response = (useQuery as QueryType)({
    queryKey: ['useRelayChains', options],
    queryFn: () => {
      const url = new URL(`${baseApiUrl}/chains`)
      setParams(url, options ?? {})
      return fetcher(`${baseApiUrl}/chains`)
    },
    enabled: baseApiUrl !== undefined,
    retry: false,
    ...queryOptions
  })

  type ConfiguredViemChain = ReturnType<typeof configureViemChain>

  return useMemo(() => {
    const chains: ConfiguredViemChain[] | undefined =
      response?.data?.chains?.map((chain: any) => configureViemChain(chain))
    return {
      ...response,
      viemChains: chains?.map((chain) => chain.viemChain),
      chains: chains ? chains : [convertViemChainToRelayChain(mainnet)]
    } as ReturnType<QueryType> & {
      viemChains?: ConfiguredViemChain['viemChain'][]
      chains?: ConfiguredViemChain[]
    }
  }, [response.data])
}
