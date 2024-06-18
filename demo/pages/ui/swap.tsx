import { NextPage } from 'next'
import { SwapWidget } from '@reservoir0x/relay-kit-ui'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { Layout } from 'components/Layout'

const SwapWidgetPage: NextPage = () => {
  const { openConnectModal } = useConnectModal()

  return (
    <Layout>
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
          defaultToToken={{
            chainId: 10,
            address: '0x7f5c764cbc14f9669b88837ca1490cca17c31607',
            decimals: 6,
            name: 'USDC',
            symbol: 'USDC',
            logoURI: 'https://ethereum-optimism.github.io/data/USDC/logo.png'
          }}
          // lockToToken={true}
          // lockFromToken={true}
          defaultFromToken={{
            chainId: 8453,
            address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
            decimals: 6,
            name: 'USDC',
            symbol: 'USDC',
            logoURI: 'https://ethereum-optimism.github.io/data/USDC/logo.png'
          }}
          // defaultAmount={'5'}
          onConnectWallet={openConnectModal}
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

export default SwapWidgetPage
