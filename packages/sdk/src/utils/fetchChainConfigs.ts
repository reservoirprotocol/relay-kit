import { configureViemChain } from './chain.js'
import type { RelayChain } from '../types/index.js'
import { axios } from './axios.js'

export const fetchChainConfigs = async (
  baseApiUrl: string
): Promise<RelayChain[]> => {
  const response = await axios.get(`${baseApiUrl}/chains`)
  if (response.data && response.data.chains) {
    return response.data.chains.map((chain: any) => configureViemChain(chain))
  }
  throw 'No Chain Data'
}
