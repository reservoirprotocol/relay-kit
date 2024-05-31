import type { AppProps } from 'next/app'
import React, { ReactNode, FC, useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import '../fonts.css'
import '@rainbow-me/rainbowkit/styles.css'
import '../fonts.css'
import { RainbowKitChain } from '@rainbow-me/rainbowkit/dist/components/RainbowKitProvider/RainbowKitChainContext'
import { Chain, mainnet } from 'wagmi/chains'
import { darkTheme, RelayKitProvider } from '@reservoir0x/relay-kit-ui'
import { configureDynamicChains, convertViemChainToRelayChain, LogLevel, MAINNET_RELAY_API, RelayChain } from '@reservoir0x/relay-sdk'
import "@reservoir0x/relay-kit-ui/styles.css"

const ALCHEMY_KEY = process.env.NEXT_PUBLIC_ALCHEMY_KEY || ''
const WALLET_CONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || ''

type AppWrapperProps = {
  children: ReactNode
}

const queryClient = new QueryClient()

const relayKitTheme = darkTheme({
  primaryColor: 'pink'
})

const AppWrapper: FC<AppWrapperProps> = ({ children }) => {
  const [wagmiConfig, setWagmiConfig] = useState<
    ReturnType<typeof createWagmiConfig>['wagmiConfig'] | undefined
  >()
  const [chains, setChains] = useState<RainbowKitChain[]>([])
  const [relayChains, setRelayChains] = useState<RelayChain[]>([])

  useEffect(() => {
    configureDynamicChains()
      .then((newChains) => {
        setRelayChains(newChains)
        const { wagmiConfig, chains } = createWagmiConfig(
          newChains.map(({ viemChain }) => viemChain as Chain)
        )
        setWagmiConfig(wagmiConfig)
        setChains(chains)
      })
      .catch((e) => {
        console.error(e)
        const { wagmiConfig, chains } = createWagmiConfig(
          [mainnet]
        )
        setRelayChains([convertViemChainToRelayChain(mainnet)])
        setWagmiConfig(wagmiConfig)
        setChains(chains)
      })
  }, [])

  if (!wagmiConfig) {
    return null
  }

  return (
    <RelayKitProvider options={{
        baseApiUrl: MAINNET_RELAY_API,
        source: 'relay-demo',
        logLevel: LogLevel.Verbose,
        chains: relayChains
      }} theme={relayKitTheme}>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
    </RelayKitProvider>
  )
}

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AppWrapper>
      {/* @ts-ignore */}
      <Component {...pageProps} />
    </AppWrapper>
  )
}

function createWagmiConfig(dynamicChains: Chain[]) {
  const chains = (dynamicChains.length === 0 ? [mainnet] : dynamicChains) as [
    Chain,
    ...Chain[]
  ]

  const wagmiConfig = getDefaultConfig({
    appName: 'Relay SDK Demo',
    projectId: WALLET_CONNECT_PROJECT_ID,
    chains: chains
  })

  return {
    wagmiConfig,
    chains
  }
}

export default MyApp
