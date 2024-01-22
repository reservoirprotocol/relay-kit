import type { AppProps } from 'next/app'
import React, { ReactNode, FC, useState, useEffect } from 'react'
import { RainbowKitProvider, getDefaultWallets } from '@rainbow-me/rainbowkit'
import { WagmiConfig, createConfig, configureChains, Chain } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'
import { alchemyProvider } from 'wagmi/providers/alchemy'
import '../fonts.css'
import '@rainbow-me/rainbowkit/styles.css'
import '../fonts.css'
import { createClient, LogLevel, configureDynamicChains, MAINNET_RELAY_API } from '@reservoir0x/relay-sdk'
import { RainbowKitChain } from '@rainbow-me/rainbowkit/dist/components/RainbowKitProvider/RainbowKitChainContext'
const ALCHEMY_KEY = process.env.NEXT_PUBLIC_ALCHEMY_KEY || ''
const WALLET_CONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || ''

type AppWrapperProps = {
  children: ReactNode
}

const relayClient = createClient({
  baseApiUrl: MAINNET_RELAY_API,
  source: "relay-demo",
  logLevel: LogLevel.Verbose,
})

const AppWrapper: FC<AppWrapperProps> = ({ children }) => {
  const [wagmiConfig, setWagmiConfig] = useState<ReturnType<typeof createWagmiConfig>['wagmiConfig'] | undefined>();
  const [chains, setChains] = useState<RainbowKitChain[]>([]);

  useEffect(() => {
    configureDynamicChains().then((newChains) => {
      const {wagmiConfig, chains} = createWagmiConfig(newChains.map(({viemChain}) => viemChain as Chain))
      setWagmiConfig(wagmiConfig)
      setChains(chains)
    }).catch((e) => {
      console.error(e)
      const {wagmiConfig, chains} = createWagmiConfig(relayClient.chains.map(({viemChain}) => viemChain as Chain))
      setWagmiConfig(wagmiConfig)
      setChains(chains)
    })
  }, [])

  if (!wagmiConfig) {
    return null
  }

  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains}>{children}</RainbowKitProvider>
    </WagmiConfig>
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
  const { chains, publicClient } = configureChains(
    dynamicChains,
    [alchemyProvider({ apiKey: ALCHEMY_KEY }), publicProvider()]
  )
  
  const { connectors } = getDefaultWallets({
    appName: 'Relay Demo',
    projectId: WALLET_CONNECT_PROJECT_ID,
    chains,
  })
  
  const wagmiConfig = createConfig({
    autoConnect: true,
    connectors,
    publicClient,
  })

  return {
    wagmiConfig,
    chains
  }
}

export default MyApp
