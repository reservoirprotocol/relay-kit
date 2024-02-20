import type { paths } from '../types/index.js'
import { axios } from '../utils/axios.js'
import { getClient } from '../client.js'
import { zeroAddress } from 'viem'

export type GetConfigQueryParams = Required<
  Pick<
    NonNullable<paths['/config']['get']['parameters']['query']>,
    'originChainId' | 'destinationChainId'
  >
> &
  Omit<
    NonNullable<paths['/config']['get']['parameters']['query']>,
    'originChainId' | 'destinationChainId'
  >

export type GetConfigResponse =
  paths['/config']['get']['responses']['200']['content']['application/json']

export async function getSolverCapacity(
  data: GetConfigQueryParams
): Promise<GetConfigResponse> {
  const client = getClient()

  if (!client) {
    throw new Error('Client not initialized')
  }

  // Fallback to zero address if user or currency are not provided
  data.user = data.user || zeroAddress
  data.currency = data.currency || zeroAddress

  const response = await axios.get<GetConfigResponse>(
    `${client.baseApiUrl}/config`,
    { params: data }
  )

  if (response.data) {
    return response.data
  }
  throw 'No solver capacity data'
}
