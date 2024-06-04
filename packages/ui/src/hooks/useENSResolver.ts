import { mainnet } from 'wagmi/chains'
import { truncateAddress, truncateEns } from '../utils/truncate'
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

export default (
  address?: string,
  chainId: number = 1,
  queryOptions?: Partial<QueryOptions>
) => {
  const addressLowercase = address?.toLowerCase()
  const isENSAvailable = chainId === mainnet.id
  const url = `https://api.ensideas.com/ens/resolve/${addressLowercase}`
  const response = (useQuery as QueryType)({
    queryKey: ['useENSResolver', address, chainId],
    queryFn: () => fetch(url).then((response) => response.json()),
    enabled: address && chainId && isENSAvailable ? true : false,
    ...queryOptions
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
