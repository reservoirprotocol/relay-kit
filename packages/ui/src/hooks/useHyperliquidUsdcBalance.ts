import { isAddress, parseUnits } from 'viem'
import {
  useQuery,
  type DefaultError,
  type QueryKey
} from '@tanstack/react-query'

export type HyperliquidMarginSummary = {
  accountValue?: string
  totalNtlPos?: string
  totalRawUsd?: string
  totalMarginUsed?: string
}

export type HyperLiquidBalanceResponse = {
  marginSummary?: HyperliquidMarginSummary
  crossMarginSummary?: HyperliquidMarginSummary
  crossMaintenanceMarginUsed?: string
  withdrawable?: string
  assetPositions?: any[]
  time?: number
} | null

type QueryType = typeof useQuery<
  HyperLiquidBalanceResponse,
  DefaultError,
  HyperLiquidBalanceResponse,
  QueryKey
>
type QueryOptions = Parameters<QueryType>['0']

export default (address?: string, queryOptions?: Partial<QueryOptions>) => {
  const queryKey = ['useHyperliquidBalances', address]
  const isEvmAddress = isAddress(address ?? '')

  const response = (useQuery as QueryType)({
    queryKey: ['useHyperliquidBalances', address],
    queryFn: async () => {
      if (!address || !isEvmAddress) {
        return null
      }

      const response = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user: address,
          type: 'clearinghouseState'
        })
      })

      const data = await response.json()

      return data as HyperLiquidBalanceResponse
    },
    ...queryOptions,
    enabled: address !== undefined && queryOptions?.enabled && isEvmAddress
  })

  const balance = parseUnits(response.data?.withdrawable ?? '0', 8)

  return {
    ...response,
    balance,
    queryKey
  } as ReturnType<QueryType> & {
    balance: bigint | undefined
    queryKey: (string | undefined)[]
  }
}
