import { NextPage } from 'next'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useState } from 'react'
import { getClient } from '@reservoir0x/relay-sdk'
import { useWalletClient } from 'wagmi'
import { base, baseGoerli, sepolia, zora } from 'viem/chains'

const CallActionPage: NextPage = () => {
  const [txs, setTxs] = useState<string[]>([])
  const [tx, setTx] = useState<string>("")
  const [toChainId, setToChainId] = useState<number>(zora.id)
  const [fromChainId, setFromChainId] = useState<number>(base.id)
  const [depositGasLimit, setDepositGasLimit] = useState("")
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
        paddingTop: 150,
      }}
    >
      <ConnectButton />
      <div>
        <label>To Chain Id: </label>
        <input type="number" placeholder='Which chain to interact with?' value={toChainId} onChange={(e) => setToChainId(Number(e.target.value))} />
      </div>
      <div>
        <label>From Chain Id: </label>
        <input type="number" placeholder='Which chain to deposit on?' value={fromChainId} onChange={(e) => setFromChainId(Number(e.target.value))} />
      </div>
      <textarea style={{minHeight: 100, minWidth: 300}} placeholder='Add a transaction object, must be valid json: {to: "", data: "", value: ""}' value={tx} onChange={(e) => setTx(e.target.value)}/>
      <div>
        <label>Deposit Gas Limit: </label>
        <input type="number" value={depositGasLimit} onChange={(e) => setDepositGasLimit(e.target.value)} />
      </div>
      <button
      style={{
        background: 'blue',
        color: 'white',
        border: '1px solid #ffffff',
        borderRadius: 8,
        cursor: 'pointer',
        padding: "4px 8px",
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
        }}
      >
        <b>Txs Added:</b>
        {txs.map((tx, i) => (
          <div key={i}>
            {JSON.stringify(tx)}
          </div>
        ))}
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
          cursor: 'pointer',
        }} 
        onClick={() => {
          if (!wallet) {
            throw "Please connect to execute transactions"
          }
          getClient()?.actions.call({
            chainId: fromChainId,
            wallet,
            txs: txs as any,
            toChainId,
            depositGasLimit,
            onProgress: (steps, fees, currentStep, currentStepItem, txHashes) => {
              console.log(steps, fees, currentStep, currentStepItem, txHashes)
            },
          })
        }}>
        Execute Transactions
      </button>
    </div>
  )
}

export default CallActionPage