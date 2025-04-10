import type { Token } from '../types'

const RELAY_UI_KIT_KEY = 'relayUiKitData'

interface EvmGasBufferCache {
  [chainId: number]: {
    bufferAmount: string // stored as string for bigint
    expiresAt: number // timestamp in milliseconds
  }
}

// Add Bitcoin Fee Buffer Cache interface
interface BitcoinFeeBufferCacheValue {
  bufferAmount: string // stored as string for bigint (satoshis)
  expiresAt: number // timestamp in milliseconds
}

interface RelayUiKitData {
  acceptedUnverifiedTokens: string[]
  evmGasBufferCache?: EvmGasBufferCache
  bitcoinFeeBufferCache?: BitcoinFeeBufferCacheValue // Updated type
}

export function getRelayUiKitData(): RelayUiKitData {
  if (typeof window === 'undefined')
    return { acceptedUnverifiedTokens: [], bitcoinFeeBufferCache: undefined } // Updated initial value

  let data: RelayUiKitData = {
    acceptedUnverifiedTokens: [],
    bitcoinFeeBufferCache: undefined
  } // Updated initial value
  try {
    const localStorageData = localStorage.getItem(RELAY_UI_KIT_KEY)
    data = localStorageData ? JSON.parse(localStorageData) : data
  } catch (e) {
    console.warn('Failed to get RelayKitUIData')
  }
  return data
}

export function setRelayUiKitData(newData: Partial<RelayUiKitData>): void {
  if (typeof window === 'undefined') return

  const currentData = getRelayUiKitData()
  const updatedData = { ...currentData, ...newData }
  try {
    localStorage.setItem(RELAY_UI_KIT_KEY, JSON.stringify(updatedData))
  } catch (e) {
    console.warn('Failed to update RelayKitUIData')
  }
}

export const alreadyAcceptedToken = (token: Token) => {
  const tokenKey = `${token.chainId}:${token.address}`
  const relayUiKitData = getRelayUiKitData()
  return relayUiKitData.acceptedUnverifiedTokens.includes(tokenKey)
}

/**
 * Get the cached evm gas buffer amount for a chain
 * @param chainId - The chain id to get the cached evm gas buffer amount for
 * @returns The cached evm gas buffer amount for the chain, or null if it doesn't exist or is expired
 */
export function getCachedEvmGasBufferAmount(chainId: number): string | null {
  const data = getRelayUiKitData()
  if (data.evmGasBufferCache && data.evmGasBufferCache[chainId]) {
    const cache = data.evmGasBufferCache[chainId]
    if (cache.expiresAt > Date.now()) {
      return cache.bufferAmount
    }
  }
  return null
}

/**
 * Set the cached evm gas buffer amount for a chain
 * @param chainId - The chain id to set the cached evm gas buffer amount for
 * @param bufferAmount - The buffer amount to set (as a bigint)
 * @param ttlMinutes - The time to live for the cached evm gas buffer amount in minutes
 */
export function setCachedEvmGasBufferAmount(
  chainId: number,
  bufferAmount: bigint,
  ttlMinutes: number = 5
): void {
  const data = getRelayUiKitData()
  const newCache = data.evmGasBufferCache || {}
  newCache[chainId] = {
    bufferAmount: bufferAmount.toString(),
    expiresAt: Date.now() + ttlMinutes * 60 * 1000
  }
  setRelayUiKitData({ evmGasBufferCache: newCache })
}

/**
 * Get the cached bitcoin fee buffer amount.
 * @returns The cached bitcoin fee buffer amount, or null if it doesn't exist or is expired
 */
export function getCachedBitcoinFeeBufferAmount(): string | null {
  const data = getRelayUiKitData()
  if (data.bitcoinFeeBufferCache) {
    const cache = data.bitcoinFeeBufferCache
    if (cache.expiresAt > Date.now()) {
      return cache.bufferAmount
    } else {
      // Clear expired cache entry
      setRelayUiKitData({ bitcoinFeeBufferCache: undefined })
    }
  }
  return null
}

/**
 * Set the cached bitcoin fee buffer amount.
 * @param bufferAmount - The buffer amount to set (as a bigint, in satoshis)
 * @param ttlMinutes - The time to live for the cached bitcoin fee buffer amount in minutes
 */
export function setCachedBitcoinFeeBufferAmount(
  bufferAmount: bigint,
  ttlMinutes: number = 5
): void {
  const data = getRelayUiKitData()
  const newCache: BitcoinFeeBufferCacheValue = {
    bufferAmount: bufferAmount.toString(),
    expiresAt: Date.now() + ttlMinutes * 60 * 1000
  }
  setRelayUiKitData({ bitcoinFeeBufferCache: newCache })
}
