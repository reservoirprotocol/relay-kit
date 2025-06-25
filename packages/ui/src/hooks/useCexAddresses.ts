import {
  useQuery,
  type DefaultError,
  type QueryKey
} from '@tanstack/react-query'
import { setParams } from '@reservoir0x/relay-sdk'

export type CEXAddressesResponse = {
  addresses: string[]
}

type QueryType = typeof useQuery<
  CEXAddressesResponse,
  DefaultError,
  CEXAddressesResponse,
  QueryKey
>
type QueryOptions = Parameters<QueryType>['0']

export default () => {
  const queryKey = ['useCexAddresses']

  const response = (useQuery as QueryType)({
    queryKey: queryKey,
    queryFn: () => {
      const url = new URL(``)

      return fetch(url.href)
        .then((response) => response.json())
        .then((response) => {
          return response
        })
    },
    staleTime: 1000 * 60 * 60 * 24, //24 hours
    gcTime: 1000 * 60 * 60 * 24 //24 hours
  })

  return response
}
