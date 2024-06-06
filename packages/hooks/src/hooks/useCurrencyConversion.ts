import {
  useQuery,
  type DefaultError,
  type QueryKey
} from '@tanstack/react-query'
import fetcher from '../fetcher'
import { MAINNET_RELAY_API } from '@reservoir0x/relay-sdk'

type CurrencyConversionData = Record<string, number>
type QueryType = typeof useQuery<
  CurrencyConversionData,
  DefaultError,
  CurrencyConversionData,
  QueryKey
>

type QueryOptions = Parameters<QueryType>['0']

export const queryCurrency = function (
  baseApiUrl: string = MAINNET_RELAY_API
): Promise<CurrencyConversionData> {
  const path = new URL(`${baseApiUrl}/prices/rates`)
  return fetcher(path.href)
}

export default function (baseApiUrl?: string, options?: Partial<QueryOptions>) {
  return (useQuery as QueryType)({
    queryKey: ['useCurrencyConversion'],
    queryFn: () => queryCurrency(baseApiUrl),
    refetchInterval: 60000,
    ...options
  })
}
