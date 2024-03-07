import { NextPage } from 'next'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useState } from 'react'
import { BridgeActionParameters, getClient } from '@reservoir0x/relay-sdk'
import { useWalletClient } from 'wagmi'
import { base, baseGoerli, sepolia, zora } from 'viem/chains'
import { Address, isAddress } from 'viem'

const BridgeActionPage: NextPage = () => {
  const [to, setTo] = useState<string | undefined>()
  const [amount, setAmount] = useState<string>("")
  const [currency, setCurrency] =useState<BridgeActionParameters['currency']>('eth')
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
        <input type="number" placeholder='Which chain to bridge to?' value={toChainId} onChange={(e) => setToChainId(Number(e.target.value))} />
      </div>
      <div>
        <label>From Chain Id: </label>
        <input type="number" placeholder='Which chain to deposit on?' value={fromChainId} onChange={(e) => setFromChainId(Number(e.target.value))} />
      </div>
      <div>
        <label>Amount: </label>
        <input type="number" placeholder='How much to bridge?' value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      <div>
      <div>
        <label>Currency: </label>
        <div>
          <input 
            type="radio" 
            value="eth" 
            name="currency" 
            checked={currency === "eth"} 
            onChange={(e) => setCurrency(e.target.value as 'eth')} 
          />
          <label>ETH</label>
        </div>
        <div>
          <input 
            type="radio" 
            value="usdc" 
            name="currency" 
            checked={currency === "usdc"} 
            onChange={(e) => setCurrency(e.target.value as 'usdc')} 
          />
          <label>USDC</label>
        </div>
      </div>
      </div>

      <div>
        <label>To: </label>
        <input placeholder='Who is the receiver?' value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      <div>
        <label>Deposit Gas Limit: </label>
        <input type="number" value={depositGasLimit} onChange={(e) => setDepositGasLimit(e.target.value)} />
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
          if (!amount) {
            throw "Must include an amount for bridging"
          }

          getClient()?.actions.bridge({
            chainId: fromChainId,
            wallet,
            toChainId,
            amount,
            currency,
            to: to ? to as Address : undefined,
            depositGasLimit,
            onProgress: (steps, fees, currentStep, currentStepItem) => {
              console.log(steps, fees, currentStep, currentStepItem)
            }
          })
        }}>
        Execute Bridge
      </button>
    </div>
  )
}

export default BridgeActionPage