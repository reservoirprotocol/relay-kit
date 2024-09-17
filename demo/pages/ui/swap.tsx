import { NextPage } from 'next'
import { SwapWidget } from '@reservoir0x/relay-kit-ui'
import { Layout } from 'components/Layout'
import { useTheme } from 'next-themes'
import {
  useDynamicContext,
  useDynamicModals,
  useSwitchWallet,
  useUserWallets
} from '@dynamic-labs/sdk-react-core'
import { useEffect, useMemo, useState } from 'react'
import { isEthereumWallet } from '@dynamic-labs/ethereum'
import { isSolanaWallet } from '@dynamic-labs/solana'
import { adaptSolanaWallet } from '@reservoir0x/relay-solana-wallet-adapter'
import { AdaptedWallet, adaptViemWallet } from '@reservoir0x/relay-sdk'

const dynamicStaticAssetUrl =
  'https://iconic.dynamic-static-assets.com/icons/sprite.svg'

const SwapWidgetPage: NextPage = () => {
  const { setShowAuthFlow, primaryWallet } = useDynamicContext()
  const { theme } = useTheme()
  const switchWallet = useSwitchWallet()
  const { setShowLinkNewWalletModal } = useDynamicModals()
  const userWallets = useUserWallets()
  const [wallet, setWallet] = useState<AdaptedWallet | undefined>()

  const linkedWallets = useMemo(() => {
    return userWallets.map((wallet) => {
      const walletLogoId =
        // @ts-ignore
        wallet?.connector?.wallet?.brand?.spriteId ?? wallet.key
      return {
        address: wallet.address,
        walletLogoUrl: `${dynamicStaticAssetUrl}#${walletLogoId}`,
        vmType:
          wallet.chain.toLowerCase() === 'evm'
            ? 'evm'
            : ('svm' as 'evm' | 'svm')
      }
    })
  }, [userWallets])

  useEffect(() => {
    const adaptWallet = async () => {
      try {
        if (primaryWallet !== null) {
          let adaptedWallet: AdaptedWallet | undefined
          if (isSolanaWallet(primaryWallet)) {
            const connection = await primaryWallet.getConnection()
            const signer = await primaryWallet.getSigner()

            adaptedWallet = adaptSolanaWallet(
              primaryWallet.address,
              792703809,
              connection,
              signer.signAndSendTransaction
            )
          } else if (isEthereumWallet(primaryWallet)) {
            const walletClient = await primaryWallet.getWalletClient()
            adaptedWallet = adaptViemWallet(walletClient)
          }
          setWallet(adaptedWallet)
        } else {
          setWallet(undefined)
        }
      } catch (e) {
        console.error('UNABLE TO SET WALLET', e)
        setWallet(undefined)
      }
    }
    adaptWallet()
  }, [primaryWallet])

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
          defaultFromToken={{
            chainId: 8453,
            address: '0x0000000000000000000000000000000000000000',
            decimals: 18,
            name: 'ETH',
            symbol: 'ETH',
            logoURI: 'https://assets.relay.link/icons/currencies/eth.png'
          }}
          // defaultFromToken={{
          //   chainId: 1,
          //   address: '0x446c9033e7516d820cc9a2ce2d0b7328b579406f',
          //   decimals: 8,
          //   name: 'SOLVE',
          //   symbol: 'SOLVE',
          //   logoURI:
          //     'https://assets.coingecko.com/coins/images/1768/large/Solve.Token_logo_200_200_wiyhout_BG.png?1575869846'
          // }}
          // defaultAmount={'5'}
          wallet={wallet}
          multiWalletSupportEnabled={true}
          linkedWallets={linkedWallets}
          onLinkNewWallet={() => {
            setShowLinkNewWalletModal(true)
          }}
          onSetPrimaryWallet={async (address) => {
            const newPrimaryWallet = userWallets?.find(
              (wallet) => wallet.address === address
            )

            if (newPrimaryWallet) {
              switchWallet(newPrimaryWallet?.id)
            }
          }}
          onConnectWallet={() => {
            setShowAuthFlow(true)
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

export default SwapWidgetPage
