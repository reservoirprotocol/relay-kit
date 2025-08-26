import { NextPage } from 'next'
import { Layout } from 'components/Layout'
import { useTheme } from 'next-themes'
import { Address, zeroAddress } from 'viem'
import { useState } from 'react'
import { Execute, getQuote, GetQuoteParameters } from '@relayprotocol/relay-sdk'

const DepositAddressesPage: NextPage = () => {
  const { theme } = useTheme()
  const [amount, setAmount] = useState<number | undefined>()
  const [refundAddress, setRefundAddress] = useState('')
  const [currencyAddress, setCurrencyAddress] = useState<string>(zeroAddress)
  const [recipientAddress, setRecipientAddress] = useState('')
  const [originChainId, setOriginChainId] = useState<number | undefined>()
  const [destinationChainId, setDestinationChainId] = useState<
    number | undefined
  >()
  const [quote, setQuote] = useState<Execute>()
  const [depositAddress, setDepositAddress] = useState<string | undefined>()
  const [depositAmount, setDepositAmount] = useState<string | undefined>()
  return (
    <Layout
      styles={{
        minHeight: '100%',
        height: 'auto',
        background: theme === 'light' ? 'rgba(245, 242, 255, 1)' : '#1c172b'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: 50,
          paddingInline: '10px',
          flexDirection: 'column',
          gap: 20
        }}
      >
        <div>
          <label>Amount (wei): </label>
          <input
            type="number"
            placeholder="How much to deposit?"
            value={amount}
            onChange={(e) =>
              setAmount(e.target.value ? Number(e.target.value) : undefined)
            }
          />
        </div>
        <div>
          <label>Refund Address: </label>
          <input
            type="string"
            placeholder="Where to send refunds to?"
            value={refundAddress}
            onChange={(e) => setRefundAddress(e.target.value)}
          />
        </div>
        <div>
          <label>Currency Address: </label>
          <input
            type="string"
            placeholder="What currency address?"
            value={currencyAddress}
            onChange={(e) => setCurrencyAddress(e.target.value)}
          />
        </div>
        <div>
          <label>Origin Chain Id: </label>
          <input
            type="string"
            placeholder="What origin chain id?"
            value={originChainId}
            onChange={(e) =>
              setOriginChainId(
                e.target.value ? Number(e.target.value) : undefined
              )
            }
          />
        </div>
        <div>
          <label>Destination Chain Id: </label>
          <input
            type="string"
            placeholder="What destination chain id?"
            value={destinationChainId}
            onChange={(e) =>
              setDestinationChainId(
                e.target.value ? Number(e.target.value) : undefined
              )
            }
          />
        </div>
        <div>
          <label>Recipient address: </label>
          <input
            type="string"
            placeholder="What is the recipient address?"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
          />
        </div>

        <button
          onClick={async () => {
            if (
              !destinationChainId ||
              !originChainId ||
              !recipientAddress ||
              !refundAddress
            ) {
              throw 'Missing required data'
            }

            const quoteData: GetQuoteParameters = {
              amount: `${amount}`,
              recipient: recipientAddress as Address,
              tradeType: 'EXACT_INPUT',
              toChainId: destinationChainId,
              toCurrency: currencyAddress,
              chainId: originChainId,
              currency: currencyAddress,
              options: {
                useDepositAddress: true,
                refundTo: refundAddress
              }
            }
            const data = await getQuote(quoteData, true)
            setQuote(data)
            const depositStepData =
              data.steps &&
              data.steps[0] &&
              data.steps[0].items &&
              data.steps[0].items[0]
                ? data.steps[0].items[0].data
                : undefined
            if (depositStepData) {
              setDepositAddress(depositStepData.to)
              setDepositAmount(depositStepData.value)
            }
          }}
        >
          Get Quote
        </button>

        {quote ? (
          <div>
            <div style={{ fontSize: 22, fontWeight: 600 }}>
              Instructions to relay:
            </div>
            <div>
              Send {depositAmount} wei to this address: {depositAddress}
            </div>
            <br />
            <div style={{ fontSize: 22, fontWeight: 600 }}>Quote Response:</div>
            <div style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
              {JSON.stringify(quote, null, 2)}
            </div>
          </div>
        ) : undefined}
      </div>
    </Layout>
  )
}

export default DepositAddressesPage
