import { NextPage } from 'next'
import { Layout } from 'components/Layout'
import { useTheme } from 'next-themes'
import dynamic from 'next/dynamic'
import { useState } from 'react'

const MoonPayBuyWidget = dynamic(
  () => import('@moonpay/moonpay-react').then((mod) => mod.MoonPayBuyWidget),
  { ssr: false }
)

const SwapWidgetPage: NextPage = () => {
  const { theme } = useTheme()
  const [currency, setCurrency] = useState('eth')
  const [amount, setAmount] = useState('2')
  const [depositAddress, setDepositAddress] = useState<string | undefined>()
  const [state, setState] = useState<
    'CURRENCY_SELECTION' | 'FIAT' | 'DEPOSIT_ADDRESS'
  >('CURRENCY_SELECTION')

  return (
    <Layout
      styles={{
        background: theme === 'light' ? 'rgba(245, 242, 255, 1)' : '#1c172b'
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          paddingTop: 50
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
        <MoonPayBuyWidget
          variant="embedded"
          baseCurrencyCode="usd"
          baseCurrencyAmount={amount}
          lockAmount="true"
          currencyCode="usdc"
          paymentMethod="credit_debit_card"
          walletAddress={depositAddress}
          visible
        />
      </div>
    </Layout>
  )
}

export default SwapWidgetPage
