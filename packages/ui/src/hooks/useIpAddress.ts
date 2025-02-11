import {
  useQuery,
  type DefaultError,
  type QueryKey
} from '@tanstack/react-query'

type IpifyResponse = {
  ip: string
}

type QueryType = typeof useQuery<
  IpifyResponse,
  DefaultError,
  IpifyResponse,
  QueryKey
>
type QueryOptions = Parameters<QueryType>['0']

export default (queryOptions?: Partial<QueryOptions>) => {
  const url = 'https://api.ipify.org?format=json'
  return (useQuery as QueryType)({
    queryKey: ['useIpAddress'],
    queryFn: () => fetch(url).then((response) => response.json()),
    ...queryOptions
  })
}
