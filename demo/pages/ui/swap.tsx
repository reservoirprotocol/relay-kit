import { NextPage } from 'next'
import { SwapWidget } from '@reservoir0x/relay-kit-ui'
import { useAccountModal, useConnectModal } from '@rainbow-me/rainbowkit'
import { Layout } from 'components/Layout'

const SwapWidgetPage: NextPage = () => {
  const { openConnectModal } = useConnectModal()
  const { openAccountModal } = useAccountModal()

  return (
    <Layout styles={{ background: 'rgba(245, 242, 255, 1)' }}>
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
            address: '0x0000000000000000000000000000000000000000',
            decimals: 18,
            name: 'ETH',
            symbol: 'ETH',
            logoURI: 'https://assets.relay.link/icons/currencies/eth.png'
          }}
          // lockToToken={true}
          // lockFromToken={true}
          defaultFromToken={{
            chainId: 8453,
            address: '0x0000000000000000000000000000000000000000',
            decimals: 18,
            name: 'ETH',
            symbol: 'ETH',
            logoURI: 'https://assets.relay.link/icons/currencies/eth.png'
          }}
          // defaultAmount={'5'}
          onConnectWallet={openConnectModal}
          onOpenAccountModal={openAccountModal}
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
