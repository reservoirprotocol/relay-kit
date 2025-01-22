import { NextPage } from 'next'
import { Layout } from 'components/Layout'
import { useTheme } from 'next-themes'
import dynamic from 'next/dynamic'
import { useState } from 'react'
import { useQuote } from '@reservoir0x/relay-kit-hooks'
import {
  DepositAddressModal,
  OnrampWidget,
  useRelayClient
} from '@reservoir0x/relay-kit-ui'
import { formatUnits, parseUnits, zeroAddress } from 'viem'
import { Execute } from '@reservoir0x/relay-sdk'

const MoonPayBuyWidget = dynamic(
  () => import('@moonpay/moonpay-react').then((mod) => mod.MoonPayBuyWidget),
  { ssr: false }
)

export const formatSeconds = (seconds: number): string => {
  seconds = Number(seconds)
  const d = Math.floor(seconds / (3600 * 24))
  const h = Math.floor((seconds % (3600 * 24)) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)

  const dDisplay = d > 0 ? d + (d == 1 ? ' d' : 'd ') : ''
  const hDisplay = h > 0 ? h + (h == 1 ? ' h' : 'h ') : ''
  const mDisplay = m > 0 ? m + (m == 1 ? ' m' : 'm ') : ''
  const sDisplay = s > 0 ? s + (s == 1 ? ' s' : 's ') : ''
  return `${dDisplay} ${hDisplay} ${mDisplay} ${sDisplay}`.trim()
}

const OnrampPage: NextPage = () => {
  const { theme } = useTheme()
  const [currency, setCurrency] = useState(
    '7560_0x0000000000000000000000000000000000000000'
  )
  const [amount, setAmount] = useState('20')
  const [recipient, setRecipient] = useState<string | undefined>()
  const [state, setState] = useState<
    'CURRENCY_SELECTION' | 'FIAT' | 'DEPOSIT_ADDRESS'
  >('CURRENCY_SELECTION')
  const client = useRelayClient()
  const destinationChainId = Number(currency.split('_')[0])
  const destinationCurrency = currency.split('_')[1] as string
  const quote = useQuote(
    client ?? undefined,
    undefined,
    {
      originChainId: 1,
      originCurrency: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      destinationChainId: destinationChainId,
      destinationCurrency: destinationCurrency,
      useDepositAddress: true,
      tradeType: 'EXACT_INPUT',
      amount: parseUnits(amount, 6).toString(),
      user: '0x000000000000000000000000000000000000dead'
    },
    undefined,
    undefined,
    {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false
    }
  )

  const amountOut = quote?.data?.details?.currencyOut?.amount ?? ''
  const amountOutput =
    amountOut && amountOut !== ''
      ? formatUnits(
          BigInt(amountOut),
          Number(quote.data?.details?.currencyOut?.currency?.decimals ?? 18)
        )
      : ''

  const depositAddress = quote?.data?.steps?.find(
    (step) => step.depositAddress
  )?.depositAddress

  const fromChain = client?.chains.find((chain) => chain.id === 1)
  const timeEstimate = {
    time: quote.data?.details?.timeEstimate ?? 0,
    formattedTime: formatSeconds(quote.data?.details?.timeEstimate ?? 0)
  }

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
        <OnrampWidget />
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
