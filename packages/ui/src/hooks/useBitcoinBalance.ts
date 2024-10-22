import { ProviderOptionsContext } from '../providers/RelayKitProvider.js'
import { useContext } from 'react'
import {
  useQuery,
  type DefaultError,
  type QueryKey
} from '@tanstack/react-query'

type ChainStats = {
  funded_txo_count: number
  funded_txo_sum: number
  spent_txo_count: number
  spent_txo_sum: number
  tx_count: number
}

type MempoolStats = {
  funded_txo_count: number
  funded_txo_sum: number
  spent_txo_count: number
  spent_txo_sum: number
  tx_count: number
}

// Define the main type that includes address, chain_stats, and mempool_stats
type BitcoinBalanceResponse = {
  address: string
  chain_stats: ChainStats
  mempool_stats: MempoolStats
}

type QueryType = typeof useQuery<
  bigint | undefined,
  DefaultError,
  bigint | undefined,
  QueryKey
>
type QueryOptions = Parameters<QueryType>['0']

export default (address?: string, queryOptions?: Partial<QueryOptions>) => {
  const providerOptions = useContext(ProviderOptionsContext)
  const queryKey = ['useBitcoinBalance', address]

  const response = (useQuery as QueryType)({
    queryKey: ['useBitcoinBalance', address],
    queryFn: () => {
      const url = `https://mempool.space/api/address/${address}`

      return fetch(url)
        .then((response) => response.json())
        .then((response) => {
          let balance = BigInt(0)
          if (response) {
            const balanceResponse = response as BitcoinBalanceResponse
            const fundedTxo = balanceResponse.chain_stats.funded_txo_sum
            const spentTxo = balanceResponse.chain_stats.spent_txo_sum
            balance = BigInt(fundedTxo) - BigInt(spentTxo)
          }
          return balance
        })
    },
    enabled: address !== undefined && providerOptions.duneApiKey !== undefined,
    ...queryOptions
  })

  return {
    ...response,
    balance: response.data,
    queryKey
  } as ReturnType<QueryType> & {
    balance: bigint | undefined
    queryKey: (string | undefined)[]
  }
}
