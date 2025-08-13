import {
  createClient,
  LogLevel,
  MAINNET_RELAY_WS,
  RelayChain
} from '@reservoir0x/relay-sdk'
import { RelayKitProvider } from '@reservoir0x/relay-kit-ui'
import { useTheme } from 'next-themes'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import { useRouter } from 'next/router'
import { FC, ReactNode, useEffect, useState } from 'react'

export const RelayKitProviderWrapper: FC<{
  relayApi?: string
  dynamicChains: RelayChain[]
  children: ReactNode
}> = ({ relayApi, dynamicChains, children }) => {
  const { theme } = useTheme()
  const router = useRouter()
  const [websocketsEnabled, setWebsocketsEnabled] = useState(false)

  // Handle websocket configuration from query params
  useEffect(() => {
    const websocketParam = router.query.websockets as string
    if (websocketParam !== undefined) {
      setWebsocketsEnabled(websocketParam === 'true')
    }
  }, [router.query.websockets])

  return (
    <RelayKitProvider
      options={{
        baseApiUrl: relayApi,
        source: 'relay-demo',
        logLevel: LogLevel.Verbose,
        duneConfig: {
          apiKey: process.env.NEXT_PUBLIC_DUNE_TOKEN,
          apiBaseUrl: process.env.NEXT_PUBLIC_DUNE_API_URL
        },
        chains: dynamicChains,
        privateChainIds: process.env.NEXT_PUBLIC_INCLUDE_CHAINS?.split(','),
        appName: 'Relay Demo',
        useGasFeeEstimations: true,
        pollingInterval: 1000,
        confirmationPollingInterval: 1000,
        themeScheme: theme === 'dark' ? 'dark' : 'light',
        loader: (options) => {
          return (
            <DotLottieReact
              src="/relay-loader.lottie"
              loop
              autoplay
              style={{ width: options?.width, height: options?.height }}
            />
          )
        },
        websocket: {
          enabled: websocketsEnabled,
          url: MAINNET_RELAY_WS
        }
      }}
    >
      {children}
    </RelayKitProvider>
  )
}
