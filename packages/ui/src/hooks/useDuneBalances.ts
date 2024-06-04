import { formatUnits, zeroAddress } from 'viem'
import { ProviderOptionsContext } from '../providers/RelayKitProvider'
import { useContext } from 'react'
import {
  useQuery,
  type DefaultError,
  type QueryKey
} from '@tanstack/react-query'

export type DuneBalanceResponse = {
  request_time: string
  response_time: string
  wallet_address: string
  balances: Array<{
    chain: string
    chain_id: number
    address: string
    amount: string
    symbol: string
    decimals: number
    price_usd?: number
    value_usd?: number
  }>
}

type QueryType = typeof useQuery<
  DuneBalanceResponse,
  DefaultError,
  DuneBalanceResponse,
  QueryKey
>
type QueryOptions = Parameters<QueryType>['0']

export default (address?: string, queryOptions?: Partial<QueryOptions>) => {
  const providerOptions = useContext(ProviderOptionsContext)

  const response = (useQuery as QueryType)({
    queryKey: ['useDuneBalances', address],
    queryFn: () => {
      const url = `https://api.dune.com/api/beta/balance/${address?.toLowerCase()}?all_chains`

      return fetch(url, {
        headers: {
          'X-DUNE-API-KEY': providerOptions.duneApiKey
        } as HeadersInit
      })
        .then((response) => response.json())
        .then((response) => {
          if (response.balances) {
            const balances =
              response.balances as DuneBalanceResponse['balances']
            if (balances) {
              balances
                .filter((balance) => {
                  try {
                    BigInt(balance.amount)
                    return true
                  } catch (e) {
                    return false
                  }
                })
                .sort((a, b) => {
                  // Check if value_usd exists and use it for comparison if available
                  if (a.value_usd !== undefined && b.value_usd !== undefined) {
                    return a.value_usd - b.value_usd
                  } else if (a.value_usd !== undefined) {
                    return -1 // a should come before b as it has a value_usd
                  } else if (b.value_usd !== undefined) {
                    return 1 // b should come before a as it has a value_usd
                  } else {
                    const amountA = parseFloat(
                      formatUnits(BigInt(a.amount), a.decimals)
                    )
                    const amountB = parseFloat(
                      formatUnits(BigInt(b.amount), b.decimals)
                    )
                    return amountA - amountB
                  }
                })
            }
          }
          return response
        })
    },
    enabled: address !== undefined && providerOptions.duneApiKey !== undefined,
    ...queryOptions
  })

  const balanceMap = response.data?.balances?.reduce(
    (balanceMap, balance) => {
      if (balance.address === 'native') {
        balance.address = zeroAddress
      }
      balanceMap[`${balance.chain_id}:${balance.address}`] = balance
      return balanceMap
    },
    {} as Record<string, DuneBalanceResponse['balances'][0]>
  )

  return { ...response, balanceMap } as ReturnType<QueryType> & {
    balanceMap: typeof balanceMap
  }
}
