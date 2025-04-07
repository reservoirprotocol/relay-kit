import type { Token } from '../types'

const RELAY_UI_KIT_KEY = 'relayUiKitData'

interface EvmGasBufferCache {
  [chainId: number]: {
    bufferAmount: string // stored as string for bigint
    expiresAt: number // timestamp in milliseconds
  }
}

interface RelayUiKitData {
  acceptedUnverifiedTokens: string[]
  evmGasBufferCache?: EvmGasBufferCache
}

export function getRelayUiKitData(): RelayUiKitData {
  if (typeof window === 'undefined') return { acceptedUnverifiedTokens: [] }

  let data = { acceptedUnverifiedTokens: [] }
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
 * Get the cached evm gas buffer for a chain
 * @param chainId - The chain id to get the cached evm gas buffer for
 * @returns The cached evm gas buffer for the chain, or null if it doesn't exist
 */
export function getCachedEvmGasBuffer(chainId: number): string | null {
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
 * Set the cached evm gas buffer for a chain
 * @param chainId - The chain id to set the cached evm gas buffer for
 * @param bufferAmount - The buffer amount to set
 * @param ttlMinutes - The time to live for the cached evm gas buffer in minutes
 */
export function setCachedEvmGasBuffer(
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
