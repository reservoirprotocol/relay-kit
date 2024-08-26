import { NextPage } from 'next'
import { SwapWidget } from '@reservoir0x/relay-kit-ui'
import { useAccountModal, useConnectModal } from '@rainbow-me/rainbowkit'
import { Layout } from 'components/Layout'
import { useTheme } from 'next-themes'

const SwapWidgetPage: NextPage = () => {
  const { openConnectModal } = useConnectModal()
  const { openAccountModal } = useAccountModal()
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
          // defaultFromToken={{
          //   chainId: 8453,
          //   address: '0x0000000000000000000000000000000000000000',
          //   decimals: 18,
          //   name: 'ETH',
          //   symbol: 'ETH',
          //   logoURI: 'https://assets.relay.link/icons/currencies/eth.png'
          // }}
          defaultFromToken={{
            chainId: 1,
            address: '0x446c9033e7516d820cc9a2ce2d0b7328b579406f',
            decimals: 8,
            name: 'SOLVE',
            symbol: 'SOLVE',
            logoURI:
              'https://assets.coingecko.com/coins/images/1768/large/Solve.Token_logo_200_200_wiyhout_BG.png?1575869846'
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
