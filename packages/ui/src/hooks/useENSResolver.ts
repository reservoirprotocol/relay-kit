import { truncateAddress, truncateEns } from '../utils/truncate.js'
import {
  useQuery,
  type DefaultError,
  type QueryKey
} from '@tanstack/react-query'

type ENSResolverResponse = {
  address?: string
  name?: string
  shortName?: string
  displayName?: string
  shortAddress?: string
  avatar?: string
}

type QueryType = typeof useQuery<
  ENSResolverResponse,
  DefaultError,
  ENSResolverResponse,
  QueryKey
>
type QueryOptions = Parameters<QueryType>['0']

export default (address?: string, queryOptions?: Partial<QueryOptions>) => {
  const addressLowercase = address?.toLowerCase()
  const url = `https://api.ensideas.com/ens/resolve/${addressLowercase}`
  const response = (useQuery as QueryType)({
    queryKey: ['useENSResolver', address],
    queryFn: () => fetch(url).then((response) => response.json()),
    ...queryOptions,
    enabled:
      address && address.length > 0
        ? queryOptions?.enabled !== undefined
          ? queryOptions.enabled
          : true
        : false
  })

  const shortAddress = address ? truncateAddress(address) : ''
  const shortName = response.data?.name ? truncateEns(response.data.name) : null
  let displayName = ''

  if (response.data?.name) {
    displayName = shortName || ''
  } else if (address) {
    displayName = shortAddress || ''
  }

  return {
    ...response,
    address,
    name: response.data?.name,
    shortName,
    displayName,
    shortAddress,
    avatar: response.data?.avatar
  } as ReturnType<QueryType> & ENSResolverResponse
}
