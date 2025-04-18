import {
  useQuery,
  type DefaultError,
  type QueryKey
} from '@tanstack/react-query'
import useRelayClient from './useRelayClient.js'

type SuiBalanceResponse = {
  coinType: string
  coinObjectCount: number
  totalBalance: string
  lockedBalance: Record<string, string>
}

type BitBalanceResponse = {
  balance: bigint
  lockedBalance: bigint
}

type QueryType = typeof useQuery<
  BitBalanceResponse | undefined,
  DefaultError,
  BitBalanceResponse | undefined,
  QueryKey
>
type QueryOptions = Parameters<QueryType>['0']

export default (
  address?: string,
  coinType: string = '0x2::sui::SUI',
  queryOptions?: Partial<QueryOptions>
) => {
  const client = useRelayClient()

  const rpcUrl = client?.baseApiUrl?.includes('testnet')
    ? 'https://fullnode.testnet.sui.io:443'
    : 'https://fullnode.mainnet.sui.io:443'

  const queryKey = ['useSuiBalance', address, coinType, rpcUrl]

  const response = (useQuery as QueryType)({
    queryKey,
    queryFn: async () => {
      const payload = {
        jsonrpc: '2.0',
        id: 1,
        method: 'suix_getBalance',
        params: [address, coinType]
      }

      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error.message)
      }

      const result = data.result as SuiBalanceResponse

      return {
        balance: BigInt(result.totalBalance),
        lockedBalance: BigInt(Object.values(result.lockedBalance)[0] || 0)
      }
    },
    enabled: address !== undefined,
    ...queryOptions
  })

  return {
    ...response,
    balance: response.data?.balance,
    lockedBalance: response.data?.lockedBalance,
    queryKey
  } as ReturnType<QueryType> & {
    balance: bigint | undefined
    lockedBalance: bigint | undefined
    queryKey: (string | undefined)[]
  }
}
