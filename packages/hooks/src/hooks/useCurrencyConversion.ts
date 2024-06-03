import {
  useQuery,
  type DefaultError,
  type QueryKey
} from '@tanstack/react-query'
import fetcher from '../fetcher'

type CurrencyConversionData = Record<string, number>
type QueryType = typeof useQuery<
  CurrencyConversionData,
  DefaultError,
  CurrencyConversionData,
  QueryKey
>

type QueryOptions = Parameters<QueryType>['0']

export default function (baseApiUrl?: string, options?: Partial<QueryOptions>) {
  const path = new URL(`${baseApiUrl}/prices/rates`)

  return (useQuery as QueryType)({
    queryKey: ['useCurrencyConversion'],
    queryFn: () => {
      return fetcher(path.href)
    },
    refetchInterval: 60000,
    enabled: baseApiUrl !== undefined,
    ...options
  })
}
