import type { AppProps } from 'next/app'
import React, { ReactNode, FC, useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import '../fonts.css'
import '@rainbow-me/rainbowkit/styles.css'
import '../fonts.css'
import { Chain, mainnet } from 'wagmi/chains'
import { darkTheme, RelayKitProvider } from '@reservoir0x/relay-kit-ui'
import { useRelayChains } from '@reservoir0x/relay-kit-hooks'
import { LogLevel, MAINNET_RELAY_API } from '@reservoir0x/relay-sdk'
import '@reservoir0x/relay-kit-ui/styles.css'

const ALCHEMY_KEY = process.env.NEXT_PUBLIC_ALCHEMY_KEY || ''
const WALLET_CONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || ''

type AppWrapperProps = {
  children: ReactNode
}

const queryClient = new QueryClient()

const relayKitTheme = darkTheme({
  focusColor: 'blue',
  buttons: {
    primary: {
      background: 'var(--relay-colors-primary11)',
      color: 'rgb(255, 191, 0)',
      hover: {
        background: '#FBCEB1',
        color: 'purple'
      }
    },
    secondary: {
      background: 'green',
      color: 'red',
      hover: {
        background: '#FBCEB1',
        color: 'purple'
      }
    },
    disabled: {
      background: 'red',
      color: 'pink'
    }
  },
  input: {
    background: 'green',
    borderRadius: '0px'
  },
  widget: {
    borderRadius: '0',
    border: '1px solid red',
    boxShadow: '0px 4px 30px green',
    card: {}
  },
  modal: {
    borderRadius: '20px',
    background: 'orange',
    border: '2px solid yellow'
  }
})

const AppWrapper: FC<AppWrapperProps> = ({ children }) => {
  const [wagmiConfig, setWagmiConfig] = useState<
    ReturnType<typeof getDefaultConfig> | undefined
  >()
  const { chains, viemChains } = useRelayChains(MAINNET_RELAY_API)

  useEffect(() => {
    if (!wagmiConfig && chains && viemChains) {
      setWagmiConfig(
        getDefaultConfig({
          appName: 'Relay UI Kit Playground',
          projectId: WALLET_CONNECT_PROJECT_ID,
          chains: (viemChains && viemChains.length === 0
            ? [mainnet]
            : viemChains) as [Chain, ...Chain[]]
        })
      )
    }
  }, [chains])

  if (!wagmiConfig || !chains) {
    return null
  }

  return (
    <RelayKitProvider
      options={{
        source: 'relay-ui-kit-playground',
        logLevel: LogLevel.Verbose,
        duneApiKey: process.env.NEXT_PUBLIC_DUNE_TOKEN,
        chains
      }}
      theme={relayKitTheme}
    >
      {wagmiConfig ? (
        <WagmiProvider config={wagmiConfig}>
          <RainbowKitProvider>{children}</RainbowKitProvider>
        </WagmiProvider>
      ) : null}
    </RelayKitProvider>
  )
}

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AppWrapper>
        <Component {...pageProps} />
      </AppWrapper>
    </QueryClientProvider>
  )
}

export default MyApp
