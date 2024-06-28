import { NextPage } from 'next'
import { ChainWidget } from '@reservoir0x/relay-kit-ui'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { Layout } from 'components/Layout'

const ChainWidgetPage: NextPage = () => {
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
        <ChainWidget
          chainId={8453}
          defaultToken={{
            chainId: 8453,
            address: '0x7f5c764cbc14f9669b88837ca1490cca17c31607',
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

export default ChainWidgetPage
