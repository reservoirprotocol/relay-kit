import { NextPage } from 'next'

import { useQuote } from '@reservoir0x/relay-kit-hooks'
import { useRelayClient } from '@reservoir0x/relay-kit-ui'
import { useWalletClient } from 'wagmi'
import { useState } from 'react'
import { zeroAddress } from 'viem'

const UseQuote: NextPage = () => {
  const client = useRelayClient()
  const walletClient = useWalletClient()
  const [user, setUser] = useState<string | undefined>()
  const [originChainId, setOriginChainId] = useState<number>(1)
  const [destinationChainId, setDestinationChainId] = useState<number>(10)
  const [originCurrency, setOriginCurrency] = useState<string>('')
  const [destinationCurrency, setDestinationCurrency] = useState<string>('')
  const [recipient, setRecipient] = useState<string | undefined>()
  const [tradeType, setTradeType] = useState<'EXACT_INPUT' | 'EXPECTED_OUTPUT'>(
    'EXPECTED_OUTPUT'
  )
  const [source, setSource] = useState<string | undefined>()
  const [useExternalLiquidity, setUseExternalLiquidity] =
    useState<boolean>(false)
  const [appFees, setAppFees] = useState<{ recipient: string; fee: string }[]>()
  const [amount, setAmount] = useState<string>('1000')
  const [data, setData] = useState<any>(undefined)
  const { data: response } = useQuote(
    client ?? undefined,
    walletClient.data,
    data,
    undefined,
    undefined,
    { enabled: data !== undefined && client !== undefined }
  )

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
      <div
        style={{
          marginTop: 20,
          padding: '10px',
          background: '#f0f0f0',
          borderRadius: '8px',
          marginLeft: '12px',
          marginRight: '12p',
          wordBreak: 'break-word'
        }}
      >
        <div>
          <label>User: </label>
          <input
            type="string"
            placeholder="What user address?"
            value={user}
            onChange={(e) =>
              setUser(e.target.value.length > 0 ? e.target.value : undefined)
            }
          />
        </div>
        <div>
          <label>OriginChainId: </label>
          <input
            type="number"
            placeholder="Which origin chain id?"
            value={originChainId}
            onChange={(e) => setOriginChainId(+e.target.value)}
          />
        </div>
        <div>
          <label>DestinationChainId: </label>
          <input
            type="number"
            placeholder="Which destination chain id?"
            value={destinationChainId}
            onChange={(e) => setDestinationChainId(+e.target.value)}
          />
        </div>
        <div>
          <label>OriginCurrency: </label>
          <input
            type="string"
            placeholder="What is the origin currency address?"
            value={originCurrency}
            onChange={(e) => setOriginCurrency(e.target.value)}
          />
        </div>
        <div>
          <label>DestinationCurrency: </label>
          <input
            type="string"
            placeholder="What is the destination currency address?"
            value={destinationCurrency}
            onChange={(e) => setDestinationCurrency(e.target.value)}
          />
        </div>
        <div>
          <label>Recipient: </label>
          <input
            type="string"
            placeholder="Recipient?"
            value={recipient}
            onChange={(e) =>
              setRecipient(
                e.target.value.length > 0 ? e.target.value : undefined
              )
            }
          />
        </div>
        <div>
          <label>TradeType: </label>
          <select
            onChange={(e) => {
              setTradeType(e.target.value as any)
            }}
          >
            <option value="EXACT_INPUT">EXACT_INPUT</option>
            <option value="EXPECTED_OUTPUT">EXPECTED_OUTPUT</option>
          </select>
        </div>
        <div>
          <label>AppFees: </label>
          <input
            type="string"
            placeholder="Recipient?"
            value={recipient}
            onBlur={(e) => {
              if (e.target.value.length > 0) {
                const fee = e.target.value.split(',').map((fee) => ({
                  recipient: fee.split(':')[0],
                  fee: fee.split(':')[1]
                }))
                setAppFees(fee)
              } else {
                setAppFees(undefined)
              }
            }}
          />
        </div>
        <div>
          <label>Amount: </label>
          <input
            type="string"
            placeholder="Amount?"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <button
          style={{ margin: '20px auto', marginBottom: 0, display: 'block' }}
          onClick={() => {
            setData({
              user: user ?? zeroAddress,
              originChainId,
              destinationChainId,
              originCurrency,
              destinationCurrency,
              recipient,
              tradeType,
              appFees,
              amount,
              source,
              useExternalLiquidity
            })
          }}
        >
          Get Quote
        </button>
      </div>
      <div style={{ wordBreak: 'break-word' }}>{JSON.stringify(response)}</div>
    </div>
  )
}

export default UseQuote
