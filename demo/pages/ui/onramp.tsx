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

const fiatCurrencies = [
  {
    name: 'Australian Dollar',
    code: 'aud',
    minAmount: 35,
    icon: 'https://static.moonpay.com/widget/currencies/aud.svg'
  },
  {
    name: 'Bulgarian Lev',
    code: 'bgn',
    minAmount: 40,
    icon: 'https://static.moonpay.com/widget/currencies/bgn.svg'
  },
  {
    name: 'Brazilian Real',
    code: 'brl',
    minAmount: 130,
    icon: 'https://static.moonpay.com/widget/currencies/brl.svg'
  },
  {
    name: 'Canadian Dollar',
    code: 'cad',
    minAmount: 30,
    icon: 'https://static.moonpay.com/widget/currencies/cad.svg'
  },
  {
    name: 'Swiss Franc',
    code: 'chf',
    minAmount: 20,
    icon: 'https://static.moonpay.com/widget/currencies/chf.svg'
  },
  {
    name: 'Colombian Peso',
    code: 'cop',
    minAmount: 100000,
    icon: 'https://static.moonpay.com/widget/currencies/cop.svg'
  },
  {
    name: 'Czech Koruna',
    code: 'czk',
    minAmount: 500,
    icon: 'https://static.moonpay.com/widget/currencies/czk.svg'
  },
  {
    name: 'Danish Krone',
    code: 'dkk',
    minAmount: 150,
    icon: 'https://static.moonpay.com/widget/currencies/dkk.svg'
  },
  {
    name: 'Dominican Peso',
    code: 'dop',
    minAmount: 1500,
    icon: 'https://static.moonpay.com/widget/currencies/dop.svg'
  },
  {
    name: 'Egyptian Pound',
    code: 'egp',
    minAmount: 1000,
    icon: 'https://static.moonpay.com/widget/currencies/egp.svg'
  },
  {
    name: 'Euro',
    code: 'eur',
    minAmount: 20,
    icon: 'https://static.moonpay.com/widget/currencies/eur.svg'
  },
  {
    name: 'Pound Sterling',
    code: 'gbp',
    minAmount: 20,
    icon: 'https://static.moonpay.com/widget/currencies/gbp.svg'
  },
  {
    name: 'Hong Kong Dollar',
    code: 'hkd',
    minAmount: 175,
    icon: 'https://static.moonpay.com/widget/currencies/hkd.svg'
  },
  {
    name: 'Indonesian Rupiah',
    code: 'idr',
    minAmount: 400000,
    icon: 'https://static.moonpay.com/widget/currencies/idr.svg'
  },
  {
    name: 'Israeli New Shekel',
    code: 'ils',
    minAmount: 75,
    icon: 'https://static.moonpay.com/widget/currencies/ils.svg'
  },
  {
    name: 'Jordanian Dinar',
    code: 'jod',
    minAmount: 15,
    icon: 'https://static.moonpay.com/widget/currencies/jod.svg'
  },
  {
    name: 'Kenyan Shilling',
    code: 'kes',
    minAmount: 3000,
    icon: 'https://static.moonpay.com/widget/currencies/kes.svg'
  },
  {
    name: 'Kuwaiti Dinar',
    code: 'kwd',
    minAmount: 8,
    icon: 'https://static.moonpay.com/widget/currencies/kwd.svg'
  },
  {
    name: 'Sri Lankan Rupee',
    code: 'lkr',
    minAmount: 7000,
    icon: 'https://static.moonpay.com/widget/currencies/lkr.svg'
  },
  {
    name: 'Mexican Peso',
    code: 'mxn',
    minAmount: 450,
    icon: 'https://static.moonpay.com/widget/currencies/mxn.svg'
  },
  {
    name: 'Nigerian Naira',
    code: 'ngn',
    minAmount: 20000,
    icon: 'https://static.moonpay.com/widget/currencies/ngn.svg'
  },
  {
    name: 'Norwegian Krone',
    code: 'nok',
    minAmount: 250,
    icon: 'https://static.moonpay.com/widget/currencies/nok.svg'
  },
  {
    name: 'New Zealand Dollar',
    code: 'nzd',
    minAmount: 35,
    icon: 'https://static.moonpay.com/widget/currencies/nzd.svg'
  },
  {
    name: 'Omani Rial',
    code: 'omr',
    minAmount: 10,
    icon: 'https://static.moonpay.com/widget/currencies/omr.svg'
  },
  {
    name: 'Peruvian Sol',
    code: 'pen',
    minAmount: 80,
    icon: 'https://static.moonpay.com/widget/currencies/pen.svg'
  },
  {
    name: 'Polish Złoty',
    code: 'pln',
    minAmount: 90,
    icon: 'https://static.moonpay.com/widget/currencies/pln.svg'
  },
  {
    name: 'Romanian Leu',
    code: 'ron',
    minAmount: 100,
    icon: 'https://static.moonpay.com/widget/currencies/ron.svg'
  },
  {
    name: 'Swedish Krona',
    code: 'sek',
    minAmount: 250,
    icon: 'https://static.moonpay.com/widget/currencies/sek.svg'
  },
  {
    name: 'Thai Baht',
    code: 'thb',
    minAmount: 800,
    icon: 'https://static.moonpay.com/widget/currencies/thb.svg'
  },
  {
    name: 'Turkish Lira',
    code: 'try',
    minAmount: 700,
    icon: 'https://static.moonpay.com/widget/currencies/try.svg'
  },
  {
    name: 'Taiwan Dollar',
    code: 'twd',
    minAmount: 750,
    icon: 'https://static.moonpay.com/widget/currencies/twd.svg'
  },
  {
    name: 'US Dollar',
    code: 'usd',
    minAmount: 20,
    icon: 'https://static.moonpay.com/widget/currencies/usd.svg'
  },
  {
    name: 'Vietnamese Dong',
    code: 'vnd',
    minAmount: 600000,
    icon: 'https://static.moonpay.com/widget/currencies/vnd.svg'
  },
  {
    name: 'South African Rand',
    code: 'zar',
    minAmount: 400,
    icon: 'https://static.moonpay.com/widget/currencies/zar.svg'
  }
]

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
          supportedWalletVMs={['evm', 'svm', 'bvm']}
          multiWalletSupportEnabled={true}
          linkedWallets={linkedWallets}
          fiatCurrencies={fiatCurrencies}
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
