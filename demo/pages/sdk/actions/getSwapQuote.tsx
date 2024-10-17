import { NextPage } from 'next'
import { useState } from 'react'
import { Execute } from '@reservoir0x/relay-sdk'
import { useWalletClient } from 'wagmi'
import { base, baseGoerli, sepolia, zora } from 'viem/chains'
import { Address, isAddress } from 'viem'
import { useRelayClient } from '@reservoir0x/relay-kit-ui'
import { ConnectButton } from 'components/ConnectButton'

const GetSwapQuote: NextPage = () => {
  const [recipient, setRecipient] = useState<string | undefined>()
  const [amount, setAmount] = useState<string>('')
  const [toChainId, setToChainId] = useState<number>(zora.id)
  const [fromChainId, setFromChainId] = useState<number>(base.id)
  const [toCurrency, setToCurrency] = useState('')
  const [fromCurrency, setFromCurrency] = useState('')
  const [useExactOuput, setUseExactOutput] = useState(false)
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
          placeholder="Which chain to swap from?"
          value={toChainId}
          onChange={(e) => setToChainId(Number(e.target.value))}
        />
      </div>
      <div>
        <label>To Currency: </label>
        <input
          type="string"
          placeholder="Which token address to swap from?"
          value={toCurrency}
          onChange={(e) => setToCurrency(e.target.value)}
        />
      </div>
      <div>
        <label>From Chain Id: </label>
        <input
          type="number"
          placeholder="Which chain to swap to?"
          value={fromChainId}
          onChange={(e) => setFromChainId(Number(e.target.value))}
        />
      </div>
      <div>
        <label>From Currency: </label>
        <input
          type="string"
          placeholder="Which token address to swap to?"
          value={fromCurrency}
          onChange={(e) => setFromCurrency(e.target.value)}
        />
      </div>
      <div>
        <label>Amount: </label>
        <input
          type="number"
          placeholder="How much to swap?"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
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
        <label>Use Exact Output: </label>
        <input
          type="checkbox"
          checked={useExactOuput}
          onChange={(e) => {
            setUseExactOutput(e.target.checked)
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
            throw 'Must include a value for swapping'
          }

          if (!client) {
            throw 'Missing Client!'
          }

          const quote = await client?.actions.getQuote({
            chainId: fromChainId,
            wallet,
            toChainId,
            toCurrency,
            amount,
            currency: fromCurrency,
            recipient: recipient ? (recipient as Address) : undefined,
            tradeType: useExactOuput ? 'EXPECTED_OUTPUT' : 'EXACT_INPUT'
          })
          setResponse(quote)
        }}
      >
        Get Swap Quote
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

export default GetSwapQuote
