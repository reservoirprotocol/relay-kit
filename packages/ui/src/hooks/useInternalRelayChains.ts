import { useRelayChains } from '@reservoir0x/relay-kit-hooks'
import { useRelayClient } from './index.js'

const DEFAULT_CACHE_OPTIONS = {
  staleTime: 1000 * 60 * 5, // 5 minutes
  gcTime: 1000 * 60 * 5,
  refetchOnMount: false,
  refetchOnWindowFocus: false
} as const

export const useInternalRelayChains = () => {
  const relayClient = useRelayClient()

  return useRelayChains(
    relayClient?.baseApiUrl,
    undefined,
    DEFAULT_CACHE_OPTIONS
  )
}
