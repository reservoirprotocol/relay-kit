import { configureViemChain } from './chain.js'
import type { RelayChain } from '../types/index.js'
import { axios } from './axios.js'

export const fetchChainConfigs = async (
  baseApiUrl: string,
  referrer?: string
): Promise<RelayChain[]> => {
  let queryString = ''
  if (referrer) {
    const queryParams = new URLSearchParams()
    queryParams.set('referrer', referrer)
    queryString = `?${queryParams.toString()}`
  }
  const response = await axios.get(`${baseApiUrl}/chains${queryString}`)
  if (response.data && response.data.chains) {
    return response.data.chains.map((chain: any) => configureViemChain(chain))
  }
  throw 'No Chain Data'
}
