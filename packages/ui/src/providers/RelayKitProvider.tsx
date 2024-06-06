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

  const generateThemeVariables = (
    theme: RelayKitTheme,
    prefix = ''
  ): string => {
    let cssString = ''
    for (const key in theme) {
      if (Object.prototype.hasOwnProperty.call(theme, key)) {
        const value = theme[key as keyof RelayKitTheme]
        if (typeof value !== 'object' || value === null) {
          if (typeof value === 'string') {
            const variableName = `${prefix}${key.replace(/\./g, '_')}`
            cssString += `--relay-${variableName}: ${value};\n`
          }
        } else {
          cssString += generateThemeVariables(
            value as RelayKitTheme,
            `${prefix}${key}_`
          )
        }
      }
    }
    return cssString
  }

  // Generate the CSS variable declarations
  const cssString = theme ? generateThemeVariables(theme) : null

  console.log('cssString: ', cssString)

  return (
    <ProviderOptionsContext.Provider value={providerOptions}>
      <RelayClientProvider options={options}>
        <style
          dangerouslySetInnerHTML={{
            __html: `:root {
              ${cssString}
            }`
            // __html: `:root {
            //     --radii-widget-border-radius: ${theme?.widget?.borderRadius};

            //     --text-default: var(${
            //       theme?.text?.default
            //     }, var(--colors-text_default));

            //     --relay-colors-primary_button_background: ${
            //       theme?.buttons?.primary?.background ??
            //       token('colors.primary_button_background')
            //     };

            //     --relay-colors-primary_button_background: ${
            //       theme?.buttons?.primary?.background ??
            //       defaultTheme?.buttons?.primary?.background
            //     };

            //     ${
            //       theme?.buttons?.primary?.background
            //         ? `--relay-colors-primary_button_background: ${theme?.buttons?.primary?.background};`
            //         : null
            //     }

            //   }`
          }}
        />
        {children}
      </RelayClientProvider>
    </ProviderOptionsContext.Provider>
  )
}
