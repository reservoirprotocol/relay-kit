import { createContext, useEffect, useState } from 'react'
import type { FC, ReactNode } from 'react'
import { RelayClientProvider } from './RelayClientProvider.js'
import type { RelayClientOptions } from '@reservoir0x/relay-sdk'
import type { RelayKitTheme } from '../themes'
import { defaultTheme } from '../themes'
import { token } from '@reservoir0x/relay-design-system/tokens'

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
}

export const ProviderOptionsContext = createContext<RelayKitProviderOptions>({})

export const RelayKitProvider: FC<RelayKitProviderProps> = function ({
  children,
  options,
  theme
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
      <RelayClientProvider options={options}>
        <style
          dangerouslySetInnerHTML={{
            __html: `:root {
                --radii-widget-border-radius: ${theme?.widget?.borderRadius}; 

                --text-default: var(${
                  theme?.text?.default
                }, var(--colors-text_default));


                --colors-primary_button_background: ${
                  theme?.buttons?.primary?.background ??
                  token('colors.primary_button_background')
                };
                --primary-button-color: ${
                  theme?.buttons?.primary?.background ??
                  defaultTheme?.buttons?.primary?.background
                };
              }`
          }}
        />
        {children}
      </RelayClientProvider>
    </ProviderOptionsContext.Provider>
  )
}
