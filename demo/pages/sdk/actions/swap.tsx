import { NextPage } from 'next'
import { useState } from 'react'
import { base, zora } from 'viem/chains'
import { Address } from 'viem'
import { useRelayClient } from '@reservoir0x/relay-kit-ui'
import { ConnectButton } from 'components/ConnectButton'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { isEthereumWallet } from '@dynamic-labs/ethereum'
import { isSolanaWallet } from '@dynamic-labs/solana'
import { adaptSolanaWallet } from '@reservoir0x/relay-solana-wallet-adapter'
import { adaptBitcoinWallet } from '@reservoir0x/relay-bitcoin-wallet-adapter'
import { adaptViemWallet } from '@reservoir0x/relay-sdk'
import { isBitcoinWallet } from '@dynamic-labs/bitcoin'

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
  const [txs, setTxs] = useState<string[]>([])
  const [tx, setTx] = useState<string>('')
  const client = useRelayClient()

  const { primaryWallet: primaryWallet } = useDynamicContext()

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

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          maxWidth: 600
        }}
      >
        <label>Txs (optional):</label>
        <textarea
          style={{ minHeight: 100, minWidth: 300 }}
          placeholder='Add a transaction object, must be valid json: {to: "", data: "", value: ""}'
          value={tx}
          onChange={(e) => setTx(e.target.value)}
        />
        <button
          style={{
            background: 'blue',
            color: 'white',
            border: '1px solid #ffffff',
            borderRadius: 8,
            cursor: 'pointer',
            padding: '4px 8px'
          }}
          disabled={!tx}
          onClick={() => {
            setTxs([...txs, JSON.parse(`${tx}`)])
          }}
        >
          Add Transaction
        </button>
        <div
          style={{
            marginTop: 10,
            border: '1px solid gray',
            borderRadius: 4,
            padding: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            overflow: 'scroll'
          }}
        >
          <b>Txs Added:</b>
          {txs.map((tx, i) => (
            <div key={i}>{JSON.stringify(tx)}</div>
          ))}
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
        onClick={async () => {
          if (!primaryWallet) {
            throw 'Please connect to execute transactions'
          }

          if (!amount) {
            throw 'Must include an amount for swapping'
          }

          let executionWallet

          if (fromChainId === 792703809 && isSolanaWallet(primaryWallet)) {
            const connection = await primaryWallet.getConnection()
            const signer = await primaryWallet.getSigner()

            if (!connection || !signer?.signTransaction) {
              throw 'Unable to setup Solana wallet'
            }

            executionWallet = adaptSolanaWallet(
              primaryWallet.address,
              792703809,
              connection,
              signer.signAndSendTransaction
            )
          } else if (isEthereumWallet(primaryWallet)) {
            const walletClient = await primaryWallet.getWalletClient()
            executionWallet = adaptViemWallet(walletClient)
          } else if (isBitcoinWallet(primaryWallet)) {
            executionWallet = adaptBitcoinWallet(
              primaryWallet.address,
              async (_address, _psbt, dynamicParams) => {
                try {
                  // Request the wallet to sign the PSBT
                  const response = await primaryWallet.signPsbt(dynamicParams)
                  if (!response) {
                    throw 'Missing psbt response'
                  }
                  return response.signedPsbt
                } catch (e) {
                  throw e
                }
              }
            )
          } else {
            throw 'Unable to configure wallet'
          }

          const quote = await client?.actions.getQuote({
            chainId: fromChainId,
            wallet: executionWallet,
            toChainId,
            toCurrency,
            amount,
            currency: fromCurrency,
            recipient: recipient ? (recipient as Address) : undefined,
            txs: [...(txs as any)],
            tradeType
          })
          if (!quote) {
            throw 'Missing the quote'
          }
          client?.actions.execute({
            quote,
            wallet: executionWallet,
            depositGasLimit,
            onProgress: (data) => {
              console.log(data)
            }
          })
        }}
      >
        Execute Swap
      </button>
    </div>
  )
}

export default SwapActionPage
