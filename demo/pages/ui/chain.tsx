import { NextPage } from 'next'
import { SwapWidget } from '@reservoir0x/relay-kit-ui'
import { Layout } from 'components/Layout'
import {
  useDynamicContext,
  useDynamicModals
} from '@dynamic-labs/sdk-react-core'
import { useTheme } from 'next-themes'

const ChainWidgetPage: NextPage = () => {
  const { setShowAuthFlow, primaryWallet } = useDynamicContext()
  const { setShowLinkNewWalletModal } = useDynamicModals()
  const { theme } = useTheme()

  return (
    <Layout
      styles={{
        background: theme === 'light' ? 'rgba(245, 242, 255, 1)' : '#1c172b'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          paddingTop: 50
        }}
      >
        <SwapWidget
          lockToChain={true}
          tokens={[
            {
              chainId: 8453,
              address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
              decimals: 6,
              name: 'USDC',
              symbol: 'USDC',
              logoURI: 'https://ethereum-optimism.github.io/data/USDC/logo.png'
            },
            {
              chainId: 8453,
              address: '0x0000000000000000000000000000000000000000',
              decimals: 18,
              name: 'ETH',
              symbol: 'ETH',
              logoURI: 'https://assets.relay.link/icons/1/light.png'
            }
          ]}
          defaultToToken={{
            chainId: 8453,
            address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
            decimals: 6,
            name: 'USDC',
            symbol: 'USDC',
            logoURI: 'https://ethereum-optimism.github.io/data/USDC/logo.png'
          }}
          // defaultAmount={'5'}
          onConnectWallet={() => {
            if (primaryWallet) {
              setShowLinkNewWalletModal(true)
            } else {
              setShowAuthFlow(true)
            }
          }}
          onAnalyticEvent={(eventName, data) => {
            console.log('Analytic Event', eventName, data)
          }}
          onFromTokenChange={(token) =>
            console.log('From token changed to: ', token)
          }
          onToTokenChange={(token) =>
            console.log('To token changed to: ', token)
          }
          onSwapError={(e, data) => {
            console.log('onSwapError Triggered', e, data)
          }}
          onSwapSuccess={(data) => {
            console.log('onSwapSuccess Triggered', data)
          }}
        />
      </div>
    </Layout>
  )
}

export default ChainWidgetPage
