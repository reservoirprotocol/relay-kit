import { createContext, useState } from 'react'
import type { FC, ReactNode } from 'react'
import { createClient } from '@reservoir0x/relay-sdk'
import type { RelayClientOptions, RelayClient } from '@reservoir0x/relay-sdk'
import { UI_VERSION } from '../version.js'

export interface RelayClientProviderProps {
  children: ReactNode
  options: RelayClientOptions
}

export const RelayClientContext = createContext<RelayClient | null>(null)

export const RelayClientProvider: FC<RelayClientProviderProps> = function ({
  children,
  options
}: RelayClientProviderProps): JSX.Element {
  const [clientContext] = useState<RelayClient | null>(
    createClient({ ...options, uiVersion: UI_VERSION })
  )

  return (
    <RelayClientContext.Provider value={clientContext}>
      {children}
    </RelayClientContext.Provider>
  )
}
