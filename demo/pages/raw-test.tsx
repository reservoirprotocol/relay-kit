import React, { useEffect, useState } from 'react'

export default function RawTestPage() {
  const [testResults, setTestResults] = useState<string[]>([])

  const addResult = (message: string) => {
    setTestResults((prev) => [...prev, message])
  }

  useEffect(() => {
    const testWalletOperations = async () => {
      addResult('[DEBUG] Gate.io Wallet - Starting test')
      const provider = window.ethereum
      addResult(`[DEBUG] Gate.io Wallet - Provider: ${provider ? 'Found' : 'Not found'}`)

      if (provider) {
        addResult(`[DEBUG] Gate.io Wallet - Is Gate.io: ${provider.isGateWallet ? 'Yes' : 'No'}`)
        addResult(`[DEBUG] Gate.io Wallet - Provider methods: ${Object.keys(provider).join(', ')}`)
      } else {
        addResult('[ERROR] Gate.io Wallet - No provider found. Please install Gate.io wallet.')
        return
      }

      try {
        const accounts = await provider.request({ method: 'eth_requestAccounts' })
        addResult(`[DEBUG] Gate.io Wallet - Accounts: ${accounts?.join(', ')}`)

        const chainId = await provider.request({ method: 'eth_chainId' })
        addResult(`[DEBUG] Gate.io Wallet - Chain ID: ${chainId}`)

        if (accounts?.[0]) {
          const balance = await provider.request({
            method: 'eth_getBalance',
            params: [accounts[0], 'latest']
          })
          addResult(`[DEBUG] Gate.io Wallet - Balance: ${balance}`)
        }
      } catch (error) {
        addResult(`[ERROR] Gate.io Wallet - Error: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    // Run test immediately
    testWalletOperations()
  }, []) // Empty dependency array to run once on mount

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Gate.io Wallet Raw Test Page</h1>
      <p>This page tests wallet operations directly through window.ethereum.</p>
      <div style={{ marginTop: '20px' }}>
        <h2>Test Results:</h2>
        <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
          {testResults.map((result, index) => (
            <div key={index}>{result}</div>
          ))}
        </pre>
      </div>
    </div>
  )
}
