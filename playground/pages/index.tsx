import { useConnectModal } from '@rainbow-me/rainbowkit'
import { SwapWidget } from '@reservoir0x/relay-kit-ui'
import { NextPage } from 'next'

const Index: NextPage = () => {
  const { openConnectModal } = useConnectModal()

  return (
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
        defaultFromToken={{
          chainId: 8453,
          address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
          decimals: 6,
          name: 'USDC',
          symbol: 'USDC',
          logoURI: 'https://ethereum-optimism.github.io/data/USDC/logo.png'
        }}
        defaultAmount={'5'}
        onConnectWallet={openConnectModal}
        onAnalyticEvent={(eventName, data) => {
          console.log('Analytic Event', eventName, data)
        }}
      />
    </div>
  )
}

export default Index
