import { NextPage } from 'next'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useState } from 'react'
import { BridgeActionParameters, getClient } from '@reservoir0x/relay-sdk'
import { useWalletClient } from 'wagmi'
import { base, zora } from 'viem/chains'
import { Address, isAddress } from 'viem'

const SwapActionPage: NextPage = () => {
  const [recipient, setRecipient] = useState<string | undefined>()
  const [amount, setAmount] = useState<string>('')
  const [toChainId, setToChainId] = useState<number>(zora.id)
  const [fromChainId, setFromChainId] = useState<number>(base.id)
  const [toCurrency, setToCurrency] = useState<string>('')
  const [fromCurrency, setFromCurrency] = useState<string>('')
  const [depositGasLimit, setDepositGasLimit] = useState('')
  const [tradeType, setTradeType] = useState<'EXACT_INPUT' | 'EXACT_OUTPUT'>(
    'EXACT_INPUT'
  )
  const { data: wallet } = useWalletClient()

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
        <label>To currency: </label>
        <input
          placeholder="Currency address being swapped into?"
          value={toCurrency}
          onChange={(e) => setToCurrency(e.target.value)}
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
        <label>From currency: </label>
        <input
          placeholder="Currency address being swapped from?"
          value={fromCurrency}
          onChange={(e) => setFromCurrency(e.target.value)}
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
        <label>Recipient: </label>
        <input
          placeholder="Who is the receiver?"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />
      </div>
      <div>
        <label>Deposit Gas Limit: </label>
        <input
          type="number"
          value={depositGasLimit}
          onChange={(e) => setDepositGasLimit(e.target.value)}
        />
      </div>
      <div>
        <label>Trade Type: </label>
        <div>
          <input
            type="radio"
            value="EXACT_INPUT"
            name="tradeType"
            checked={tradeType === 'EXACT_INPUT'}
            onChange={(e) => setTradeType(e.target.value as 'EXACT_INPUT')}
          />
          <label>EXACT_INPUT</label>
        </div>
        <div>
          <input
            type="radio"
            value="EXACT_OUTPUT"
            name="tradeType"
            checked={tradeType === 'EXACT_OUTPUT'}
            onChange={(e) => setTradeType(e.target.value as 'EXACT_OUTPUT')}
          />
          <label>EXACT_OUTPUT</label>
        </div>
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
        onClick={() => {
          if (!wallet) {
            throw 'Please connect to execute transactions'
          }
          if (recipient && !isAddress(recipient)) {
            throw 'Recipient must be an address'
          }
          if (!amount) {
            throw 'Must include an amount for bridging'
          }

          getClient()?.actions.swap({
            chainId: fromChainId,
            wallet,
            toChainId,
            toCurrency,
            amount,
            currency: fromCurrency,
            recipient: recipient ? (recipient as Address) : undefined,
            depositGasLimit,
            options: {
              tradeType
            },
            onProgress: (data) => {
              console.log(data)
            }
          })
        }}
      >
        Execute Bridge
      </button>
    </div>
  )
}

export default SwapActionPage
