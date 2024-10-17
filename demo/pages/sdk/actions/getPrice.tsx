import { NextPage } from 'next'
import { useState } from 'react'
import { Execute } from '@reservoir0x/relay-sdk'
import { useAccount } from 'wagmi'
import { base, baseGoerli, sepolia, zora } from 'viem/chains'
import { Address, isAddress, zeroAddress } from 'viem'
import { useRelayClient } from '@reservoir0x/relay-kit-ui'
import { ConnectButton } from 'components/ConnectButton'

const GetPricePage: NextPage = () => {
  const [recipient, setRecipient] = useState<string | undefined>()
  const [amount, setAmount] = useState<string>('')
  const [originCurrency, setOriginCurrency] = useState<string>(zeroAddress)
  const [destinationCurrency, setDestinationCurrency] =
    useState<string>(zeroAddress)
  const [toChainId, setToChainId] = useState<number>(zora.id)
  const [fromChainId, setFromChainId] = useState<number>(base.id)
  const [useExactInput, setUseExactInput] = useState(false)
  const { address } = useAccount()
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
        <label>Destination Currency: </label>
        <input
          placeholder="Destination Currency Address"
          value={destinationCurrency}
          onChange={(e) => setDestinationCurrency(e.target.value)}
        />
      </div>
      <div>
        <label>Origin Currency: </label>
        <input
          placeholder="Origin Currency Address"
          value={originCurrency}
          onChange={(e) => setOriginCurrency(e.target.value)}
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

          const price = await client?.actions.getPrice({
            user: address,
            originChainId: fromChainId,
            destinationChainId: toChainId,
            amount,
            originCurrency,
            destinationCurrency,
            recipient: recipient ? (recipient as Address) : undefined,
            tradeType: useExactInput ? 'EXACT_INPUT' : 'EXPECTED_OUTPUT'
          })
          setResponse(price)
        }}
      >
        Get Price
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

export default GetPricePage
