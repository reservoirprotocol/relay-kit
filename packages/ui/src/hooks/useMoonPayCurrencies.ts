import {
  useQuery,
  type DefaultError,
  type QueryKey
} from '@tanstack/react-query'
import { setParams } from '@reservoir0x/relay-sdk'

export type MoonPayFiatCurrency = {
  id: string
  createdAt: string
  updatedAt: string
  type: 'fiat'
  name: string
  code: string
  precision: number
  minBuyAmount: number
  maxBuyAmount: number
  isSellSupported: boolean
  icon: string
}

export type MoonPayCryptoCurrency = {
  id: string
  createdAt: string
  updatedAt: string
  type: 'crypto'
  name: string
  code: string
  precision: number
  minBuyAmount: number
  maxBuyAmount: number
  minSellAmount: number
  maxSellAmount: number
  addressRegex: string
  testnetAddressRegex: string
  supportsAddressTag: boolean
  addressTagRegex: string | null
  supportsTestMode: boolean
  isSuspended: boolean
  isSupportedInUs: boolean
  isSellSupported: boolean
  notAllowedUSStates: string[]
  notAllowedCountries: string[]
  metadata: {
    contractAddress: string
    chainId: string
    networkCode: string
  }
}

export type MoonpayCurrenciesResponse =
  | [MoonPayCryptoCurrency | MoonPayFiatCurrency]
  | null

type QueryType = typeof useQuery<
  MoonpayCurrenciesResponse,
  DefaultError,
  MoonpayCurrenciesResponse,
  QueryKey
>
type QueryOptions = Parameters<QueryType>['0']
type MoonpayCurrenciesQueryParams = {
  apiKey?: string
}

export default (
  queryParams?: MoonpayCurrenciesQueryParams,
  queryOptions?: Partial<QueryOptions>
) => {
  const queryKey = ['useMoonpayQuote', queryParams]

  const response = (useQuery as QueryType)({
    queryKey: queryKey,
    queryFn: () => {
      const url = new URL(`https://api.moonpay.com/v3/currencies`)

      setParams(url, queryParams as MoonpayCurrenciesQueryParams)

      return fetch(url.href)
        .then((response) => response.json())
        .then((response) => {
          return response
        })
    },
    ...queryOptions,
    enabled: queryParams?.apiKey !== undefined && queryOptions?.enabled
  })

  return response
}
