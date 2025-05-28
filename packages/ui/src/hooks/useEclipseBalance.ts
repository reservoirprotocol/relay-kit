import {
  useQuery,
  type DefaultError,
  type QueryKey
} from '@tanstack/react-query'
import useRelayClient from './useRelayClient.js'

type EclipseBalanceResponse = {
  value: number
}

type BalanceResponse = {
  balance: bigint
}

type QueryType = typeof useQuery<
  BalanceResponse | undefined,
  DefaultError,
  BalanceResponse | undefined,
  QueryKey
>
type QueryOptions = Parameters<QueryType>['0']

export default (address?: string, queryOptions?: Partial<QueryOptions>) => {
  const client = useRelayClient()
  const eclipseChain = client?.chains?.find((chain) => chain.id === 9286185)
  const rpcUrl =
    eclipseChain && eclipseChain.httpRpcUrl
      ? eclipseChain.httpRpcUrl
      : 'https://mainnetbeta-rpc.eclipse.xyz'
  const queryKey = ['useEclipseBalance', address, rpcUrl]

  const response = (useQuery as QueryType)({
    queryKey,
    queryFn: async () => {
      const payload = {
        jsonrpc: '2.0',
        id: 1,
        method: 'getBalance',
        params: [address]
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

      const result = data.result as EclipseBalanceResponse

      return {
        balance: BigInt(result.value)
      }
    },
    enabled: address !== undefined,
    ...queryOptions
  })

  return {
    ...response,
    balance: response.data?.balance,
    queryKey
  } as ReturnType<QueryType> & {
    balance: bigint | undefined
    queryKey: (string | undefined)[]
  }
}
