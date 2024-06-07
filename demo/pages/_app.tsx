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
import { LogLevel, MAINNET_RELAY_API } from '@reservoir0x/relay-sdk'

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
  const { chains, viemChains } = useRelayChains(MAINNET_RELAY_API)

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
  }, [chains])

  if (!wagmiConfig || !chains) {
    return null
  }

  return (
    <RelayKitProvider
      options={{
        source: 'relay-demo',
        logLevel: LogLevel.Verbose,
        duneApiKey: process.env.NEXT_PUBLIC_DUNE_TOKEN,
        chains
      }}
      theme={
        {
          // primaryColor: 'red',
          // anchor: {
          //   color: 'red'
          // }
          // focusColor: 'green',
          // subtleBorderColor: 'green',
          // text: {
          //   default: 'red',
          //   subtle: 'purple'
          // },
          // input: {
          //   background: 'red'
          // },
          // buttons: {
          //   tertiary: {
          //     background: 'orange',
          //     color: 'red',
          //     hover: {
          //       color: 'blue',
          //       background: 'purple'
          //     }
          //   },
          //   disabled: {
          //     background: 'green',
          //     color: 'red'
          //   }
          // },
          // widget: {
          //   background: 'pink',
          //   borderRadius: '0px',
          //   border: '2px solid orange',
          //   card: {
          //     background: 'pink'
          //   }
          // },
          // modal: {
          //   background: 'orange'
          // },
          // dropdown: {
          //   background: 'red',
          //   borderRadius: '0px'
          // }
        }
      }
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
