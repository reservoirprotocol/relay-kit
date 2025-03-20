import {
  useQuery,
  type DefaultError,
  type QueryKey
} from '@tanstack/react-query'
import { setParams } from '@reservoir0x/relay-sdk'

export type MoonPayBuyTransactionsResponse = {
  id?: string
  createdAt?: string
  baseCurrencyAmount?: number
  status?:
    | 'waitingPayment'
    | 'pending'
    | 'waitingAuthorization'
    | 'failed'
    | 'completed'
  failureReason?: string
  externalTransactionId?: string
}
export type MoonPayBuyTransactionErrorResponse = {
  message?: string
  moonPayErrorCode?: string
  type?: string
}

type QueryType = typeof useQuery<
  MoonPayBuyTransactionsResponse | MoonPayBuyTransactionErrorResponse,
  DefaultError,
  MoonPayBuyTransactionsResponse | MoonPayBuyTransactionErrorResponse,
  QueryKey
>
type QueryOptions = Parameters<QueryType>['0']

type MoonPayTransactionQueryParams = {
  apiKey?: string
}

export default (
  externalTransactionId?: string,
  queryParams?: MoonPayTransactionQueryParams,
  queryOptions?: Partial<QueryOptions>
) => {
  const queryKey = ['useMoonPayTransaction', externalTransactionId]

  const response = (useQuery as QueryType)({
    queryKey: queryKey,
    queryFn: () => {
      const url = new URL(
        `https://api.moonpay.com/v1/transactions/ext/${externalTransactionId}`
      )

      setParams(url, queryParams as MoonPayTransactionQueryParams)

      return fetch(url.href)
        .then((response) => response.json())
        .then((response) => {
          return response && response.length > 0 ? response[0] : response
        })
    },
    ...queryOptions,
    enabled:
      queryParams?.apiKey !== undefined &&
      externalTransactionId !== undefined &&
      queryOptions?.enabled
  })

  return response
}
