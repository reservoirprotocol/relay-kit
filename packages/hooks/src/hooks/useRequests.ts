import {
  MAINNET_RELAY_API,
  type paths,
  setParams
} from '@reservoir0x/relay-sdk'
import { useMemo } from 'react'
import {
  useInfiniteQuery,
  type DefaultError,
  type InfiniteData,
  type QueryKey
} from '@tanstack/react-query'
import fetcher from '../fetcher.js'

export type UserTransactionQuery =
  paths['/requests']['get']['parameters']['query'] & { id?: string }

export type UserTransactionsResponse =
  paths['/requests']['get']['responses']['200']['content']['application/json']

type InfiniteQueryType = typeof useInfiniteQuery<
  UserTransactionsResponse,
  DefaultError,
  InfiniteData<UserTransactionsResponse>,
  QueryKey,
  string | undefined | null
>
type QueryOptions = Parameters<InfiniteQueryType>['0']

export const queryRequests = function (
  baseApiUrl: string = MAINNET_RELAY_API,
  options?: UserTransactionQuery | false,
  pageParam?: string | null
): Promise<UserTransactionsResponse> {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const url = new URL(`${baseApiUrl}/requests`, baseUrl)

  let query: UserTransactionQuery = { ...options }

  if (pageParam) {
    query.continuation = pageParam
  }

  setParams(url, query)
  return fetcher(url.href)
}

export default function (
  options?: UserTransactionQuery | false,
  baseApiUrl?: string,
  queryOptions?: Partial<QueryOptions>
) {
  const response = (useInfiniteQuery as InfiniteQueryType)({
    queryKey: ['useUserTransactions', options],
    enabled: options !== undefined,
    queryFn: (data) => queryRequests(baseApiUrl, options, data.pageParam),
    getNextPageParam: (data) => {
      return data.continuation
    },
    initialPageParam: null,
    retry: false,
    ...queryOptions
  })

  const transactions = useMemo(
    () => response.data?.pages?.flatMap((page) => page?.requests || []) ?? [],
    [response.data]
  )

  return {
    ...response,
    data: transactions
  }
}
