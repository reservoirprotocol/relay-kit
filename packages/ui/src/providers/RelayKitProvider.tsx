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
  disablePoweredByReservoir?: boolean
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
  font: '--relay-fonts-body',
  primaryColor: '--relay-colors-primary-color',
  focusColor: '--relay-colors-focus-color',
  subtleBorderColor: '--relay-colors-subtle-border-color',
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
    tertiary: {
      color: '--relay-colors-tertiary-button-color',
      background: '--relay-colors-tertiary-button-background',
      hover: {
        color: '--relay-colors-tertiary-button-hover-color',
        background: '--relay-colors-tertiary-button-hover-background'
      }
    },
    white: {
      color: '--relay-colors-primary-button-color',
      background: '--relay-colors-primary-button-background',
      hover: {
        color: '--relay-colors-primary-button-hover-color',
        background: '--relay-colors-primary-button-hover-background'
      }
    },
    disabled: {
      color: '--relay-colors-button-disabled-color',
      background: '--relay-colors-button-disabled-background'
    }
  },
  input: {
    background: '--relay-colors-input-background',
    borderRadius: '--relay-radii-input-border-radius',
    color: '--relay-colors-input-color'
  },
  anchor: {
    color: '--relay-colors-anchor-color',
    hover: {
      color: '--relay-colors-anchor-hover-color'
    }
  },
  dropdown: {
    background: '--relay-colors-dropdown-background',
    borderRadius: '--relay-radii-dropdown-border-radius'
  },
  widget: {
    background: '--relay-colors-widget-background',
    borderRadius: '--relay-radii-widget-border-radius',
    border: '--relay-borders-widget-border',
    boxShadow: '--relay-shadows-widget-box-shadow',
    card: {
      background: '--relay-colors-widget-card-background',
      borderRadius: '--relay-radii-widget-card-border-radius'
    }
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
      duneApiKey: options.duneApiKey,
      disablePoweredByReservoir: options.disablePoweredByReservoir
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
