import { NextPage } from 'next'
import { Layout } from '../../components/Layout'
import { useTheme } from 'next-themes'
import { useMemo, useRef, useState } from 'react'
import { LinkedWallet } from '@reservoir0x/relay-kit-ui'
import { OnrampWidget } from '@reservoir0x/relay-kit-ui/OnrampWidget'

import {
  useDynamicContext,
  useDynamicEvents,
  useDynamicModals,
  useUserWallets,
  Wallet
} from '@dynamic-labs/sdk-react-core'
import { useWalletFilter } from 'context/walletFilter'
import { convertToLinkedWallet } from 'utils/dynamic'
import { RelayChain } from '@reservoir0x/relay-sdk'

const OnrampPage: NextPage = () => {
  const { theme } = useTheme()
  useDynamicEvents('walletAdded', (newWallet) => {
    if (linkWalletPromise) {
      linkWalletPromise?.resolve(convertToLinkedWallet(newWallet))
      setLinkWalletPromise(undefined)
    }
  })
  const [linkWalletPromise, setLinkWalletPromise] = useState<
    | {
        resolve: (value: LinkedWallet) => void
        reject: () => void
        params: { chain?: RelayChain; direction: 'to' | 'from' }
      }
    | undefined
  >()
  const { setWalletFilter } = useWalletFilter()
  const { setShowAuthFlow, primaryWallet } = useDynamicContext()
  const { setShowLinkNewWalletModal } = useDynamicModals()
  const userWallets = useUserWallets()
  const wallets = useRef<Wallet<any>[]>()
  const linkedWallets = useMemo(() => {
    const _wallets = userWallets.reduce((linkedWallets, wallet) => {
      linkedWallets.push(convertToLinkedWallet(wallet))
      return linkedWallets
    }, [] as LinkedWallet[])
    wallets.current = userWallets
    return _wallets
  }, [userWallets])

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
        <OnrampWidget
          moonPayApiKey={process.env.NEXT_PUBLIC_MOONPAY_API_KEY as string}
          supportedWalletVMs={['evm', 'svm', 'bvm']}
          multiWalletSupportEnabled={true}
          linkedWallets={linkedWallets}
          moonpayOnUrlSignatureRequested={async (
            url: string
          ): Promise<string> => {
            const response = await fetch(`/api/sign-url?url=${url}`)
            const data = await response.json()
            return data.signature
          }}
          onLinkNewWallet={({ chain, direction }) => {
            if (linkWalletPromise) {
              linkWalletPromise.reject()
              setLinkWalletPromise(undefined)
            }
            if (chain?.vmType === 'evm') {
              setWalletFilter('EVM')
            } else if (chain?.id === 792703809) {
              setWalletFilter('SOL')
            } else if (chain?.id === 8253038) {
              setWalletFilter('BTC')
            } else if (chain?.id === 9286185) {
              setWalletFilter('ECLIPSE')
            } else {
              setWalletFilter(undefined)
            }
            const promise = new Promise<LinkedWallet>((resolve, reject) => {
              setLinkWalletPromise({
                resolve,
                reject,
                params: {
                  chain,
                  direction
                }
              })
            })
            setShowLinkNewWalletModal(true)
            return promise
          }}
          onConnectWallet={() => {
            setShowAuthFlow(true)
          }}
          onAnalyticEvent={(eventName, data) => {
            console.log('Analytic Event', eventName, data)
          }}
        />
      </div>
    </Layout>
  )
}

export default OnrampPage
