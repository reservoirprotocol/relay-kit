import { NextPage } from 'next'
import { useState } from 'react'
import { Execute } from '@reservoir0x/relay-sdk'
import { useWalletClient } from 'wagmi'
import { base, baseGoerli, sepolia, zora } from 'viem/chains'
import { Address, isAddress, zeroAddress } from 'viem'
import { useRelayClient } from '@reservoir0x/relay-kit-ui'
import { ConnectButton } from 'components/ConnectButton'

const GetBridgeQuotePage: NextPage = () => {
  const [recipient, setRecipient] = useState<string | undefined>()
  const [amount, setAmount] = useState<string>('')
  const [currency, setCurrency] = useState<string>(zeroAddress)
  const [toChainId, setToChainId] = useState<number>(zora.id)
  const [fromChainId, setFromChainId] = useState<number>(base.id)
  const [useExactInput, setUseExactInput] = useState(false)
  const { data: wallet } = useWalletClient()
  const [response, setResponse] = useState<Execute | null>(null)
  const client = useRelayClient()

  return (
    <div
      style={{
        display: 'flex',
        height: 50,
        width: '100%',
        gap: 12,
        padding: 24,
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 150
      }}
    >
      <ConnectButton />
      <div>
        <label>To Chain Id: </label>
        <input
          type="number"
          placeholder="Which chain to bridge to?"
          value={toChainId}
          onChange={(e) => setToChainId(Number(e.target.value))}
        />
      </div>
      <div>
        <label>From Chain Id: </label>
        <input
          type="number"
          placeholder="Which chain to deposit on?"
          value={fromChainId}
          onChange={(e) => setFromChainId(Number(e.target.value))}
        />
      </div>
      <div>
        <label>Amount: </label>
        <input
          type="number"
          placeholder="How much to bridge?"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <div>
        <label>Currency: </label>
        <div>
          <input
            type="radio"
            value="eth"
            name="currency"
            checked={currency === 'eth'}
            onChange={(e) => setCurrency(e.target.value as 'eth')}
          />
          <label>ETH</label>
        </div>
        <div>
          <input
            type="radio"
            value="usdc"
            name="currency"
            checked={currency === 'usdc'}
            onChange={(e) => setCurrency(e.target.value as 'usdc')}
          />
          <label>USDC</label>
        </div>
      </div>
      <div>
        <label>To: </label>
        <input
          placeholder="Who is the receiver?"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />
      </div>

      <div>
        <label>Use Exact Input: </label>
        <input
          type="checkbox"
          checked={useExactInput}
          onChange={(e) => {
            setUseExactInput(e.target.checked)
          }}
        />
      </div>

      <button
        style={{
          marginTop: 50,
          padding: 24,
          background: 'blue',
          color: 'white',
          fontSize: 18,
          border: '1px solid #ffffff',
          borderRadius: 8,
          fontWeight: 800,
          cursor: 'pointer'
        }}
        onClick={async () => {
          if (recipient && !isAddress(recipient)) {
            throw 'Recipient must be an address'
          }
          if (!amount) {
            throw 'Must include a value for bridging'
          }

          if (!client) {
            throw 'Missing Client!'
          }

          const quote = await client?.actions.getQuote({
            chainId: fromChainId,
            wallet, // optional
            toChainId,
            amount,
            currency,
            toCurrency: zeroAddress,
            recipient: recipient ? (recipient as Address) : undefined,
            tradeType: useExactInput ? 'EXACT_INPUT' : 'EXPECTED_OUTPUT'
          })
          setResponse(quote)
        }}
      >
        Get Bridge Quote
      </button>
      {response && (
        <div
          style={{
            marginTop: 20,
            padding: '10px',
            background: '#f0f0f0',
            borderRadius: '8px',
            width: '100%',
            maxWidth: 1000
          }}
        >
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

export default GetBridgeQuotePage
