import { SwapWidget } from '@reservoir0x/relay-kit-ui'
import { useConnectModal } from '@rainbow-me/rainbowkit'

export default function Home() {
  const { openConnectModal } = useConnectModal()

  return (
    <main className="flex items-center justify-center w-full py-20">
      <SwapWidget
        defaultToToken={{
          chainId: 10,
          address: '0x7f5c764cbc14f9669b88837ca1490cca17c31607',
          decimals: 6,
          name: 'USDC',
          symbol: 'USDC',
          logoURI: 'https://ethereum-optimism.github.io/data/USDC/logo.png'
        }}
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
    </main>
  )
}
