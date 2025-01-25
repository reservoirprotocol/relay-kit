import { NextPage } from 'next'
import { Layout } from 'components/Layout'
import { useTheme } from 'next-themes'
import { useMemo, useRef, useState } from 'react'
import { useQuote } from '@reservoir0x/relay-kit-hooks'
import {
  LinkedWallet,
  OnrampWidget,
  useRelayClient
} from '@reservoir0x/relay-kit-ui'
import { formatUnits, parseUnits } from 'viem'
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
          supportedWalletVMs={['evm', 'svm', 'bvm']}
          multiWalletSupportEnabled={true}
          linkedWallets={linkedWallets}
          moonpayApiKey={process.env.NEXT_PUBLIC_MOONPAY_API_KEY as string}
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
      {/* {state === 'CURRENCY_SELECTION' ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            paddingTop: 50,
            gap: 8
          }}
        >
          <h2>Choose a currency</h2>
          <div>
            <label>Currency: </label>
            <select
              value={currency}
              onChange={(e) => {
                setCurrency(e.target.value as any)
              }}
            >
              <option value="7560_0x0000000000000000000000000000000000000000">
                Cyber ETH
              </option>
              <option value="70700_0x0000000000000000000000000000000000000000">
                Apex ETH
              </option>
            </select>
          </div>
          <div>
            <label>Choose an amount: </label>
            <select
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value as any)
              }}
            >
              <option value="20">$20</option>
              <option value="50">$50</option>
              <option value="100">$100</option>
            </select>
          </div>
          <div>
            <label>Enter your wallet address: </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>
          <button
            style={{
              marginTop: 20
            }}
            onClick={() => {
              setState('FIAT')
            }}
          >
            Continue
          </button>
        </div>
      ) : null}
      {state === 'FIAT' ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            gap: 8
          }}
        >
          <h2 style={{ margin: 0 }}>Purchase Crypto</h2>
          <MoonPayBuyWidget
            variant="embedded"
            baseCurrencyCode="usd"
            baseCurrencyAmount={amount}
            lockAmount="true"
            currencyCode="usdc"
            // paymentMethod="credit_debit_card"
            walletAddress={depositAddress}
            showWalletAddressForm="false"
            visible
            //@ts-ignore
            cex
            onTransactionCompleted={async () => {
              setState('DEPOSIT_ADDRESS')
            }}
          />
        </div>
      ) : null}
      {state === 'DEPOSIT_ADDRESS' ? (
        <DepositAddressModal
          open={true}
          onOpenChange={() => {}}
          defaultQuote={quote.data as Execute}
          fromChain={fromChain}
          fromToken={
            fromChain
              ? {
                  chainId: fromChain?.id,
                  address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                  name: 'USDC',
                  symbol: 'USDC',
                  decimals: 6,
                  logoURI:
                    'https://coin-images.coingecko.com/coins/images/6319/large/usdc.png',
                  verified: true
                }
              : undefined
          }
          toToken={
            destinationChainId
              ? {
                  chainId: destinationChainId,
                  address: zeroAddress,
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18,
                  logoURI: 'https://assets.relay.link/icons/currencies/eth.png',
                  verified: true
                }
              : undefined
          }
          debouncedInputAmountValue={amount}
          debouncedOutputAmountValue={amountOutput}
          address={recipient}
          recipient={recipient}
          timeEstimate={timeEstimate}
          invalidateBalanceQueries={() => {}}
        />
      ) : null} */}
    </Layout>
  )
}

export default OnrampPage
