import { NextPage } from 'next'
import { useState } from 'react'
import { useRelayClient } from '@relayprotocol/relay-kit-ui'

const GetAppFeesPage: NextPage = () => {
  const [wallet, setWallet] = useState('')
  const [balances, setBalances] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const client = useRelayClient()

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        padding: 24,
        paddingTop: 150
      }}
    >
      <div>
        <label>Wallet Address: </label>
        <input
          type="text"
          placeholder="Enter wallet address"
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          style={{ minWidth: 350, padding: 8 }}
        />
      </div>
      <button
        style={{
          marginTop: 20,
          padding: 16,
          background: 'blue',
          color: 'white',
          fontSize: 16,
          border: '1px solid #ffffff',
          borderRadius: 8,
          fontWeight: 700,
          cursor: 'pointer'
        }}
        disabled={!wallet || loading}
        onClick={async () => {
          setError(null)
          setBalances(null)
          setLoading(true)
          try {
            if (!client) throw new Error('Missing Client!')
            const result = await client.actions.getAppFees({ wallet })
            setBalances(result)
          } catch (e: any) {
            setError(e?.message || String(e))
          } finally {
            setLoading(false)
          }
        }}
      >
        {loading ? 'Loading...' : 'Get App Fees'}
      </button>
      {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
      {balances && (
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
          <pre>{JSON.stringify(balances, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

export default GetAppFeesPage
