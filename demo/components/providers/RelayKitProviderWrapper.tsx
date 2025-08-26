import { LogLevel, RelayChain } from '@reservoir0x/relay-sdk'
import { RelayKitProvider } from '@reservoir0x/relay-kit-ui'
import { useTheme } from 'next-themes'
import { FC, ReactNode } from 'react'

export const RelayKitProviderWrapper: FC<{
  relayApi?: string
  dynamicChains: RelayChain[]
  children: ReactNode
}> = ({ relayApi, dynamicChains, children }) => {
  const { theme } = useTheme()
  return (
    <RelayKitProvider
      options={{
        baseApiUrl: relayApi,
        source: 'relay-demo',
        logLevel: LogLevel.Verbose,
        duneConfig: {
          apiKey: process.env.NEXT_PUBLIC_DUNE_TOKEN,
          apiBaseUrl: 'https://api.sim.dune.com'
        },
        chains: dynamicChains,
        privateChainIds: process.env.NEXT_PUBLIC_INCLUDE_CHAINS?.split(','),
        appName: 'Relay Demo',
        useGasFeeEstimations: true,
        pollingInterval: 1000,
        confirmationPollingInterval: 1000,
        themeScheme: theme === 'dark' ? 'dark' : 'light',
        appFees: [
          {
            fee: '1000',
            recipient:
              process.env.NEXT_PUBLIC_FEE_RECIPIENT ??
              '0x03508bB71268BBA25ECaCC8F620e01866650532c'
          }
        ]
      }}
    >
      {children}
    </RelayKitProvider>
  )
}
