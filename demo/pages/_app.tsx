import '@reservoir0x/relay-kit-ui/styles.css'
import '@rainbow-me/rainbowkit/styles.css'
import '../fonts.css'

import type { AppProps } from 'next/app'
import React, { ReactNode, FC, useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { Chain, mainnet } from 'wagmi/chains'
import { RelayKitProvider } from '@reservoir0x/relay-kit-ui'
import { useRelayChains } from '@reservoir0x/relay-kit-hooks'
import {
  LogLevel,
  MAINNET_RELAY_API,
  TESTNET_RELAY_API
} from '@reservoir0x/relay-sdk'
import { ThemeProvider } from 'next-themes'
import { useRouter } from 'next/router'

const ALCHEMY_KEY = process.env.NEXT_PUBLIC_ALCHEMY_KEY || ''
const WALLET_CONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || ''

type AppWrapperProps = {
  children: ReactNode
}

const queryClient = new QueryClient()

const AppWrapper: FC<AppWrapperProps> = ({ children }) => {
  const [wagmiConfig, setWagmiConfig] = useState<
    ReturnType<typeof getDefaultConfig> | undefined
  >()
  const router = useRouter()
  const relayApi =
    router.query.api === 'testnets' ? TESTNET_RELAY_API : MAINNET_RELAY_API

  const { chains, viemChains } = useRelayChains(relayApi)

  useEffect(() => {
    if (!wagmiConfig && chains && viemChains) {
      setWagmiConfig(
        getDefaultConfig({
          appName: 'Relay SDK Demo',
          projectId: WALLET_CONNECT_PROJECT_ID,
          chains: (viemChains && viemChains.length === 0
            ? [mainnet]
            : viemChains) as [Chain, ...Chain[]]
        })
      )
    }
  }, [chains, relayApi])

  if (!wagmiConfig || !chains) {
    return null
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <RelayKitProvider
        options={{
          source: 'relay-demo',
          logLevel: LogLevel.Verbose,
          duneApiKey: process.env.NEXT_PUBLIC_DUNE_TOKEN,
          chains
        }}
        theme={{
          anchor: {
            color: 'red',
            hover: {
              color: 'red'
            }
          },
          focusColor: '#00C7FF',
          subtleBorderColor: '#808080',
          text: {
            default: 'black',
            subtle: 'black'
          },
          input: {
            background: '#F3F3F3',
            color: 'black'
          },
          buttons: {
            primary: {
              background: '#00C7FF',
              color: 'white',
              hover: {
                color: 'white',
                background: '#00C7FF'
              }
            },
            secondary: {
              background: 'gray',
              color: '#00C7FF',
              hover: {
                color: '#00C7FF',
                background: 'gray'
              }
            },

            disabled: {
              background: '#808080',
              color: 'white'
            }
          },
          widget: {
            background: 'rgb(230 249 255 / 1)',
            borderRadius: '0px',
            border: '2px solid #00C7FF',
            card: {
              background: 'white',
              borderRadius: '0px'
            }
          },
          modal: {
            background: 'white'
          },
          dropdown: {
            background: '#F3F3F3'
          }
        }}
      >
        {wagmiConfig ? (
          <WagmiProvider config={wagmiConfig}>
            <RainbowKitProvider>{children}</RainbowKitProvider>
          </WagmiProvider>
        ) : null}
      </RelayKitProvider>
    </ThemeProvider>
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
