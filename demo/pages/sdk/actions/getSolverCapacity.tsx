import { NextPage } from 'next'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { getClient, GetConfigResponse } from '@reservoir0x/relay-sdk'
import { useState } from 'react'
import { base, zora } from 'viem/chains'
import { zeroAddress } from 'viem'
import { useWalletClient } from 'wagmi'

const GetSolverCapcityPage: NextPage = () => {
  const [destinationChainId, setDestinationChainId] = useState<string>(
    zora.id.toString()
  )
  const [originChainId, setOriginChainId] = useState<string>(base.id.toString())
  const [currency, setCurrency] = useState<string>('eth')
  const [user, setUser] = useState<string>(zeroAddress)
  const { data: wallet } = useWalletClient()
  const [response, setResponse] = useState<GetConfigResponse | null>(null)

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
        <label>Origin Chain Id: </label>
        <input
          type="text"
          value={originChainId}
          onChange={(e) => setOriginChainId(e.target.value)}
        />
      </div>
      <div>
        <label>Destination Chain Id: </label>
        <input
          type="text"
          value={destinationChainId}
          onChange={(e) => setDestinationChainId(e.target.value)}
        />
      </div>
      <div>
        <label>Currency: </label>
        <input
          type="text"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
        />
      </div>
      <div>
        <label>User: </label>
        <input
          type="text"
          value={user}
          onChange={(e) => setUser(e.target.value)}
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
          if (!wallet) {
            throw 'Please connect your wallet'
          }

          const solverCapacity = await getClient()?.actions.getSolverCapacity({
            destinationChainId,
            originChainId,
            user: user,
            currency: currency as any
          })
          setResponse(solverCapacity)
        }}
      >
        Get Solver Capacity
      </button>
      {response && (
        <div
          style={{
            marginTop: 20,
            padding: '10px',
            background: '#f0f0f0',
            borderRadius: '8px',
            width: '100%',
            maxWidth: 600
          }}
        >
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

export default GetSolverCapcityPage
