import { createContext, useEffect, useState } from 'react'
import type { FC, ReactNode } from 'react'
import {
  configureDynamicChains,
  convertViemChainToRelayChain,
  createClient,
  LogLevel
} from '@reservoir0x/relay-sdk'
import type {
  RelayClientOptions,
  RelayClient,
  RelayChain
} from '@reservoir0x/relay-sdk'
import { mainnet } from 'viem/chains'
export interface RelayClientProviderProps {
  children: ReactNode
  options: RelayClientOptions
  onChainsConfigured?: (chains: RelayChain[]) => void
}

export const RelayClientContext = createContext<RelayClient | null>(null)

const initializeContext = (
  options: RelayClientOptions,
  onChainsConfigured: RelayClientProviderProps['onChainsConfigured']
) => {
  const client = createClient(options)
  configureDynamicChains()
    .then((chains) => {
      onChainsConfigured?.(chains)
    })
    .catch(() => {
      client.log(['Failed to fetch dynamic chains', LogLevel.Warn])
      onChainsConfigured?.([convertViemChainToRelayChain(mainnet)])
    })
  return client
}

export const RelayClientProvider: FC<RelayClientProviderProps> = function ({
  children,
  options,
  onChainsConfigured
}: RelayClientProviderProps) {
  const [clientContext, setClientContext] = useState<RelayClient | null>(null)

  useEffect(() => {
    if (!clientContext) {
      setClientContext(initializeContext(options, onChainsConfigured))
    }
  }, [])

  return (
    <RelayClientContext.Provider value={clientContext}>
      {children}
    </RelayClientContext.Provider>
  )
}
