import { createContext, useEffect, useState } from 'react'
import type { FC, ReactNode } from 'react'
import {
  RelayClientProvider,
  type RelayClientProviderProps
} from './RelayClientProvider.js'
import type { RelayClientOptions } from '@reservoir0x/relay-sdk'
import type { RelayKitTheme } from '../themes'

export type CoinId = {
  [key: string]: string
}
export type CoinGecko = {
  proxy?: string
  apiKey?: string
  coinIds?: CoinId
}

type RelayKitProviderOptions = {
  duneApiKey?: string
}
export interface RelayKitProviderProps {
  children: ReactNode
  options: RelayClientOptions & RelayKitProviderOptions
  theme?: RelayKitTheme
  onChainsConfigured?: RelayClientProviderProps['onChainsConfigured']
}

export const ProviderOptionsContext = createContext<RelayKitProviderOptions>({})

export const RelayKitProvider: FC<RelayKitProviderProps> = function ({
  children,
  options,
  theme,
  onChainsConfigured
}: RelayKitProviderProps) {
  const [providerOptions, setProviderOptions] =
    useState<RelayKitProviderOptions>({})

  useEffect(() => {
    setProviderOptions({
      duneApiKey: options.duneApiKey
    })
  }, [options])

  return (
    <ProviderOptionsContext.Provider value={providerOptions}>
      <RelayClientProvider
        options={options}
        onChainsConfigured={onChainsConfigured}
      >
        <style
          dangerouslySetInnerHTML={{
            __html: `:root {
                --colors-primary1: ${theme?.colors.primaryColor};
              }`
          }}
        />
        {children}
      </RelayClientProvider>
    </ProviderOptionsContext.Provider>
  )
}
