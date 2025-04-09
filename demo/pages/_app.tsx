import '@reservoir0x/relay-kit-ui/styles.css'
import '../fonts.css'
import '../global.css'

import type { AppProps } from 'next/app'
import React, { ReactNode, FC, useState, useEffect, lazy } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createConfig, http, WagmiProvider } from 'wagmi'
import { Chain, mainnet, optimism } from 'wagmi/chains'
import { useRelayChains } from '@reservoir0x/relay-kit-hooks'
import {
  convertViemChainToRelayChain,
  LogLevel,
  MAINNET_RELAY_API,
  TESTNET_RELAY_API
} from '@reservoir0x/relay-sdk'
import { ThemeProvider } from 'next-themes'
import { useRouter } from 'next/router'
import {
  DynamicContextProvider,
  FilterChain
} from '@dynamic-labs/sdk-react-core'
import { EthereumWalletConnectors } from '@dynamic-labs/ethereum'
import { SolanaWalletConnectors } from '@dynamic-labs/solana'
import { BitcoinWalletConnectors } from '@dynamic-labs/bitcoin'
import { convertRelayChainToDynamicNetwork } from 'utils/dynamic'
import { DynamicWagmiConnector } from '@dynamic-labs/wagmi-connector'
import { HttpTransport } from 'viem'
import { chainIdToAlchemyNetworkMap } from 'utils/chainIdToAlchemyNetworkMap'
import { useWalletFilter, WalletFilterProvider } from 'context/walletFilter'
import { EclipseWalletConnectors } from '@dynamic-labs/eclipse'
import { AbstractEvmWalletConnectors } from '@dynamic-labs-connectors/abstract-global-wallet-evm'
import { RelayKitProvider } from '@reservoir0x/relay-kit-ui'

const MoonPayProvider = lazy(() =>
  import('@moonpay/moonpay-react').then((module) => ({
    default: module.MoonPayProvider
  }))
)

type AppWrapperProps = {
  children: ReactNode
}

const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_KEY || ''

const queryClient = new QueryClient()

const AppWrapper: FC<AppWrapperProps> = ({ children }) => {
  const { walletFilter, setWalletFilter } = useWalletFilter()
  const [wagmiConfig, setWagmiConfig] = useState<
    ReturnType<typeof createConfig> | undefined
  >()
  const router = useRouter()
  const [relayApi, setRelayApi] = useState(MAINNET_RELAY_API)

  useEffect(() => {
    const isTestnet = router.query.api === 'testnets'
    const newApi = isTestnet ? TESTNET_RELAY_API : MAINNET_RELAY_API
    if (relayApi !== newApi) {
      setRelayApi(isTestnet ? TESTNET_RELAY_API : MAINNET_RELAY_API)
    }
  }, [router.query.api])

  const { chains, viemChains } = useRelayChains(
    relayApi,
    {
      includeChains: process.env.NEXT_PUBLIC_INCLUDE_CHAINS
    },
    {
      refetchOnWindowFocus: false,
      refetchOnMount: false
    }
  )

  useEffect(() => {
    if (chains && viemChains && !wagmiConfig) {
      setWagmiConfig(
        createConfig({
          chains: (viemChains && viemChains.length === 0
            ? [mainnet]
            : viemChains) as [Chain, ...Chain[]],
          multiInjectedProviderDiscovery: false,
          transports: chains.reduce(
            (transportsConfig: Record<number, HttpTransport>, chain) => {
              const network = chainIdToAlchemyNetworkMap[chain.id]
              if (network && ALCHEMY_API_KEY) {
                transportsConfig[chain.id] = http(
                  `https://${network}.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
                )
              } else {
                transportsConfig[chain.id] = http() // Fallback to default HTTP transport
              }
              return transportsConfig
            },
            {}
          )
        })
      )
    }
  }, [chains, relayApi, viemChains])

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
          baseApiUrl: relayApi,
          source: 'relay-demo',
          logLevel: LogLevel.Verbose,
          duneConfig: {
            apiKey: process.env.NEXT_PUBLIC_DUNE_TOKEN,
            apiBaseUrl: 'https://api.dune.com'
          },
          chains,
          privateChainIds: process.env.NEXT_PUBLIC_INCLUDE_CHAINS?.split(','),
          appName: 'Relay Demo',
          useGasFeeEstimations: true
          // appFees: [
          //   {
          //     recipient: '0x0000000000000000000000000000000000000000',
          //     fee: '100' // 1%
          //   }
          // ]
        }}
        // theme={
        //   {
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
        // boxShadow:
        //   '0px 0px 30px 0px #0000000D, inset 0px 0px 30px 0px #0000000D'
        // background: 'pink',
        // borderRadius: '0px',
        // border: '2px solid orange',
        // card: {
        //   background: 'pink'
        // }
        // selector: {
        //   background: 'red',
        //   hover: {
        //     background: 'green'
        //   }
        // }
        // }
        // modal: {
        //   background: 'orange'
        // },
        // dropdown: {
        //   background: 'red',
        //   borderRadius: '0px'
        // }
        //   }
        // }
      >
        <DynamicContextProvider
          settings={{
            logLevel: 'INFO',
            environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENV_ID ?? '',
            walletConnectors: [
              EthereumWalletConnectors,
              SolanaWalletConnectors,
              BitcoinWalletConnectors,
              EclipseWalletConnectors,
              AbstractEvmWalletConnectors
            ],
            cssOverrides: `
              [data-testid="send-balance-button"] {
                display: none;
              }
            `,
            walletsFilter: walletFilter ? FilterChain(walletFilter) : undefined,
            overrides: {
              evmNetworks: () => {
                return chains
                  .filter((chain) => chain.vmType === 'evm')
                  .map((chain) => {
                    return convertRelayChainToDynamicNetwork(chain)
                  })
              }
            },
            initialAuthenticationMode: 'connect-only',
            events: {
              onAuthFlowClose: () => {
                setWalletFilter(undefined)
              }
            }
          }}
        >
          <WagmiProvider config={wagmiConfig}>
            <MoonPayProvider
              apiKey={process.env.NEXT_PUBLIC_MOONPAY_API_KEY as string}
              debug
            >
              <DynamicWagmiConnector>{children}</DynamicWagmiConnector>
            </MoonPayProvider>
          </WagmiProvider>
        </DynamicContextProvider>
      </RelayKitProvider>
    </ThemeProvider>
  )
}

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <WalletFilterProvider>
      <QueryClientProvider client={queryClient}>
        <AppWrapper>
          <Component {...pageProps} />
        </AppWrapper>
      </QueryClientProvider>
    </WalletFilterProvider>
  )
}

export default MyApp
