import React, { createContext, useEffect, useState } from 'react'
import type { FC, ReactNode } from 'react'
import { RelayClientProvider } from './RelayClientProvider.js'
import type { RelayClientOptions } from '@reservoir0x/relay-sdk'

export type CoinId = {
  [key: string]: string
}
export type CoinGecko = {
  proxy?: string
  apiKey?: string
  coinIds?: CoinId
}

type RelayKitProviderOptions = {}
export interface RelayKitProviderProps {
  children: ReactNode
  options: RelayClientOptions & RelayKitProviderOptions
}

export const ProviderOptionsContext = createContext<RelayKitProviderOptions>({})

export const RelayKitProvider: FC<RelayKitProviderProps> = function ({
  children,
  options
}: RelayKitProviderProps) {
  const [providerOptions, setProviderOptions] =
    useState<RelayKitProviderOptions>({})

  useEffect(() => {
    setProviderOptions(options)
  }, [options])

  return (
    <ProviderOptionsContext.Provider value={providerOptions}>
      <RelayClientProvider options={options}>{children}</RelayClientProvider>
    </ProviderOptionsContext.Provider>
  )
}
