import {
  useQuery,
  type DefaultError,
  type QueryKey
} from '@tanstack/react-query'
import { setParams } from '@relayprotocol/relay-sdk'

export type MoonPayGeolocationResponse = {
  alpha2: string
  alpha3: string
  country: string
  ipAddress: string
  isAllowed: boolean
  isBuyAllowed: boolean
  isNftAllowed: boolean
  isSellAllowed: boolean
  isBalanceLedgerWithdrawAllowed: boolean
  isFiatBalanceAllowed: boolean
  isMoonPayBalanceAllowed: boolean
  isLowLimitEnabled: boolean
  state: string
}

type QueryType = typeof useQuery<
  MoonPayGeolocationResponse,
  DefaultError,
  MoonPayGeolocationResponse,
  QueryKey
>
type QueryOptions = Parameters<QueryType>['0']
type MoonpayCurrenciesQueryParams = {
  apiKey?: string
  ipAddress?: string
}

export default (
  queryParams?: MoonpayCurrenciesQueryParams,
  queryOptions?: Partial<QueryOptions>
) => {
  const queryKey = ['useMoonPayGeolocation', queryParams]

  const response = (useQuery as QueryType)({
    queryKey: queryKey,
    queryFn: () => {
      const url = new URL(`https://api.moonpay.com/v3/ip_address`)

      setParams(url, queryParams as MoonpayCurrenciesQueryParams)

      return fetch(url.href)
        .then((response) => response.json())
        .then((response) => {
          return response
        })
    },
    ...queryOptions,
    enabled:
      queryParams?.apiKey !== undefined &&
      queryParams.ipAddress !== undefined &&
      queryOptions?.enabled
  })

  return response
}
