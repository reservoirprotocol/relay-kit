import { type Chain, type WalletClient } from 'viem'

export interface WalletTestResult {
  provider: boolean
  accounts: string[]
  chainId: string
  balance?: string
  signature?: string
  error?: Error
}

// Extend existing IEthereum interface
declare global {
  interface IEthereum {
    isGateWallet?: boolean
  }
  interface Window {
    ethereum?: IEthereum
    testWalletOperations: () => Promise<WalletTestResult>
  }
}

/**
 * Test basic Gate.io Web3 wallet operations
 * Run this in the browser console to verify wallet functionality
 */
export async function testWalletOperations(): Promise<WalletTestResult> {
  console.log('[DEBUG] Gate.io Wallet Test - Starting basic operations test')
  const result: WalletTestResult = {
    provider: false,
    accounts: [],
    chainId: ''
  }

  try {
    // Check provider existence
    const provider = window.ethereum
    result.provider = !!provider
    console.log('[DEBUG] Gate.io Wallet Test - Provider:', {
      exists: result.provider,
      methods: provider ? Object.keys(provider) : [],
      isGate: provider?.isGateWallet || false
    })

    if (!provider) {
      throw new Error('No Ethereum provider found')
    }

    // Request accounts
    console.log('[DEBUG] Gate.io Wallet Test - Requesting accounts...')
    const accountsResponse = await provider.request({
      method: 'eth_requestAccounts'
    })
    const accounts = (accountsResponse as unknown) as string[]
    result.accounts = accounts
    console.log('[DEBUG] Gate.io Wallet Test - Accounts:', accounts)

    // Get chain ID
    console.log('[DEBUG] Gate.io Wallet Test - Getting chain ID...')
    const chainIdResponse = await provider.request({
      method: 'eth_chainId'
    })
    const chainId = (chainIdResponse as unknown) as string
    result.chainId = chainId
    console.log('[DEBUG] Gate.io Wallet Test - Chain ID:', chainId)

    // Get balance
    if (accounts?.[0]) {
      console.log('[DEBUG] Gate.io Wallet Test - Getting balance...')
      const balanceResponse = await provider.request({
        method: 'eth_getBalance',
        params: [accounts[0], 'latest']
      })
      const balance = (balanceResponse as unknown) as string
      result.balance = balance
      console.log('[DEBUG] Gate.io Wallet Test - Balance:', balance)
    }

    // Test signing capability
    if (accounts?.[0]) {
      console.log('[DEBUG] Gate.io Wallet Test - Testing message signing...')
      const message = 'Test message signing with Gate.io wallet'
      const signatureResponse = await provider.request({
        method: 'personal_sign',
        params: [message, accounts[0]]
      })
      const signature = (signatureResponse as unknown) as string
      result.signature = signature
      console.log('[DEBUG] Gate.io Wallet Test - Signature:', signature)
    }

    return result
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err))
    console.error('[DEBUG] Gate.io Wallet Test - Error:', {
      message: error.message,
      code: (error as any).code,
      stack: error.stack
    })
    result.error = error
    return result
  }
}

// Add to window object for easy console access
if (typeof window !== 'undefined') {
  window.testWalletOperations = testWalletOperations
}
