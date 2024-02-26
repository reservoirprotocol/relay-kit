import { NextPage } from 'next'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useState } from 'react'
import { getClient } from '@reservoir0x/relay-sdk'
import { useWalletClient } from 'wagmi'
import { base, baseGoerli, sepolia, zora } from 'viem/chains'
import { Address, isAddress } from 'viem'

const BridgeActionPage: NextPage = () => {
  const [to, setTo] = useState<string | undefined>()
  const [value, setValue] = useState<string>("")
  const [toChainId, setToChainId] = useState<number>(zora.id)
  const [fromChainId, setFromChainId] = useState<number>(base.id)
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
        <input type="number" placeholder='Which chain to bridge to?' value={toChainId} onChange={(e) => setToChainId(Number(e.target.value))} />
      </div>
      <div>
        <label>From Chain Id: </label>
        <input type="number" placeholder='Which chain to deposit on?' value={fromChainId} onChange={(e) => setFromChainId(Number(e.target.value))} />
      </div>
      <div>
        <label>Value: </label>
        <input type="number" placeholder='How much to bridge?' value={value} onChange={(e) => setValue(e.target.value)} />
      </div>
      <div>
        <label>To: </label>
        <input type="number" placeholder='Who is the receiver?' value={to} onChange={(e) => setTo(e.target.value)} />
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
          if (to && !isAddress(to)) {
            throw "To must be an address"
          }
          if (!value) {
            throw "Must include a value for bridging"
          }

          getClient()?.actions.bridge({
            chainId: fromChainId,
            wallet,
            toChainId,
            value,
            to: to ? to as Address : undefined,
            onProgress: (steps, fees, currentStep, currentStepItem) => {
              console.log(steps, fees, currentStep, currentStepItem)
            }
          })
        }}>
        Execute Transactions
      </button>
    </div>
  )
}

export default BridgeActionPage