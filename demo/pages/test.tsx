import React, { useEffect } from 'react'

export default function TestPage() {
  useEffect(() => {
    const testWalletOperations = async () => {
      console.log('[DEBUG] Gate.io Wallet - Starting test')
      const provider = window.ethereum
      console.log('[DEBUG] Gate.io Wallet - Provider:', provider)
      console.log('[DEBUG] Gate.io Wallet - Provider methods:', provider ? Object.keys(provider) : 'No provider')

      try {
        const accounts = await provider?.request({ method: 'eth_requestAccounts' })
        console.log('[DEBUG] Gate.io Wallet - Accounts:', accounts)

        const chainId = await provider?.request({ method: 'eth_chainId' })
        console.log('[DEBUG] Gate.io Wallet - Chain ID:', chainId)

        if (accounts?.[0]) {
          const balance = await provider?.request({
            method: 'eth_getBalance',
            params: [accounts[0], 'latest']
          })
          console.log('[DEBUG] Gate.io Wallet - Balance:', balance)
        }
      } catch (error) {
        console.error('[DEBUG] Gate.io Wallet - Error:', error)
      }
    }

    testWalletOperations()
  }, [])

  return (
    <div style={{ padding: 20 }}>
      <h1>Gate.io Wallet Test Page</h1>
      <p>Please check the browser console for test results.</p>
      <p>Required operations being tested:</p>
      <ul>
        <li>eth_requestAccounts</li>
        <li>eth_chainId</li>
        <li>eth_getBalance</li>
      </ul>
    </div>
  )
}
