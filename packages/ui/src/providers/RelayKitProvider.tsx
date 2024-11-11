import { createContext, useMemo } from 'react'
import type { FC, ReactNode } from 'react'
import { RelayClientProvider } from './RelayClientProvider.js'
import type { ChainVM, RelayClientOptions, paths } from '@reservoir0x/relay-sdk'
import type { RelayKitTheme } from '../themes/index.js'
import { generateCssVars } from '../utils/theme.js'

export type AppFees =
  paths['/quote']['post']['requestBody']['content']['application/json']['appFees']

type RelayKitProviderOptions = {
  /**
   * The name of the application
   */
  appName?: string
  /**
   * An array of fee objects composing of a recipient address and the fee in BPS
   */
  appFees?: AppFees
  /**
   * This key is used to fetch token balances, to improve the general UX and suggest relevant tokens
   * Can be omitted and the ui will continue to function. Refer to the dune docs on how to get an api key
   */
  duneApiKey?: string
  /**
   * Disable the powered by reservoir footer
   */
  disablePoweredByReservoir?: boolean
  /**
   * An objecting mapping either a VM type (evm, svm, bvm) or a chain id to a connector key (metamask, backpacksol, etc).
   * Connector keys are used for differentiating which wallet maps to which vm/chain.
   * Only relevant for eclipse/solana at the moment.
   */
  vmConnectorKeyOverrides?: {
    [key in number | 'evm' | 'svm' | 'bvm']?: string[]
  }
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
  subtleBackgroundColor: '--relay-colors-subtle-background-color',
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
  skeleton: {
    background: '--relay-colors-skeleton-background'
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
    },
    selector: {
      background: '--relay-colors-widget-selector-background',
      hover: {
        background: '--relay-colors-widget-selector-hover-background'
      }
    },
    swapCurrencyButtonBorderColor: '--widget-swap-currency-button-border-color'
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
  const providerOptions = useMemo(
    () => ({
      appName: options.appName,
      appFees: options.appFees,
      duneApiKey: options.duneApiKey,
      disablePoweredByReservoir: options.disablePoweredByReservoir,
      vmConnectorKeyOverrides: options.vmConnectorKeyOverrides
    }),
    [options]
  )

  // Generate the CSS variable declarations
  const cssVariables = useMemo(
    () => generateCssVars(theme, themeOverrides),
    [theme]
  )

  return (
    <ProviderOptionsContext.Provider value={providerOptions}>
      <RelayClientProvider options={options}>
        <style
          dangerouslySetInnerHTML={{
            __html: `.relay-kit-reset {
              ${cssVariables}
            }`
          }}
        />
        {children}
      </RelayClientProvider>
    </ProviderOptionsContext.Provider>
  )
}
