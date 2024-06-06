import { createContext, useEffect, useState } from 'react'
import type { FC, ReactNode } from 'react'
import { RelayClientProvider } from './RelayClientProvider.js'
import type { RelayClientOptions } from '@reservoir0x/relay-sdk'
import type { RelayKitTheme } from '../themes'
import { generateCssVars } from '../utils/theme.js'

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

export type ThemeOverridesMap = {
  [key: string]: string | ThemeOverridesMap
}

export const themeOverrides: ThemeOverridesMap = {
  font: '--relay-fonts-font',
  primaryColor: '--relay-colors-primary-color',
  focusColor: '--relay-colors-focus-color',
  text: {
    default: '--relay-colors-text-default',
    subtle: '--relay-colors-text-subtle',
    error: '--relay-colors-text-error',
    success: '--relay-colors-text-success'
  },
  buttons: {
    primary: {
      color: '--relay-colors-primary-button-color',
      background: '--relay-colors-primary-button-background',
      hover: {
        color: '--relay-colors-primary-button-hover-color',
        background: '--relay-colors-primary-button-hover-background'
      }
    },
    secondary: {
      color: '--relay-colors-secondary-button-color',
      background: '--relay-colors-secondary-button-background',
      hover: {
        color: '--relay-colors-secondary-button-hover-color',
        background: '--relay-colors-secondary-button-hover-background'
      }
    },
    disabled: {
      color: '--relay-colors-button-disabled-color',
      background: '--relay-colors-button-disabled-background'
    }
  },
  input: {
    background: '--relay-colors-input-background',
    borderRadius: '--relay-radii-input-border-radius'
  },
  widget: {
    background: '--relay-colors-widget-background',
    borderRadius: '--relay-radii-widget-border-radius',
    border: '--relay-borders-widget-border',
    boxShadow: '--relay-shadows-widget-box-shadow',
    card: {}
  },
  modal: {
    background: '--relay-colors-modal-background',
    borderRadius: '--relay-radii-modal-border-radius',
    border: '--relay-borders-modal-border'
  }
}

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

  // Generate the CSS variable declarations
  const cssVariables = generateCssVars(theme, themeOverrides)

  return (
    <ProviderOptionsContext.Provider value={providerOptions}>
      <RelayClientProvider options={options}>
        <style
          dangerouslySetInnerHTML={{
            __html: `:root {
              ${cssVariables}
            }`
          }}
        />
        {children}
      </RelayClientProvider>
    </ProviderOptionsContext.Provider>
  )
}
