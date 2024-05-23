import type { paths } from '../types/index.js'
import { axios } from '../utils/axios.js'
import { getClient } from '../client.js'
import { zeroAddress } from 'viem'
import type { AxiosInstance } from 'axios'

export type GetConfigQueryParams = Required<
  Pick<
    NonNullable<paths['/config']['get']['parameters']['query']>,
    'originChainId' | 'destinationChainId'
  >
> &
  Omit<
    NonNullable<paths['/config/v2']['get']['parameters']['query']>,
    'originChainId' | 'destinationChainId'
  >

export type GetConfigResponse =
  paths['/config/v2']['get']['responses']['200']['content']['application/json']

export async function getSolverCapacity(
  data: GetConfigQueryParams,
  axiosInstance: AxiosInstance = axios
): Promise<GetConfigResponse> {
  const client = getClient()

  if (!client) {
    throw new Error('Client not initialized')
  }

  // Fallback to zero address if user is not provided
  data.user = data.user || zeroAddress
  data.currency = data.currency

  const response = await axiosInstance.get<GetConfigResponse>(
    `${client.baseApiUrl}/config/v2`,
    { params: data }
  )

  if (response.data) {
    return response.data
  }
  throw 'No solver capacity data'
}
