import type { Token } from '../types'
import {
  RELAY_UI_KIT_KEY,
  DEFAULT_CACHE_TTL_MINUTES
} from '../constants/cache.js'

interface CacheEntry {
  value: string
  expiresAt: number
}

interface RelayUiKitData {
  acceptedUnverifiedTokens: string[]
  genericCache?: { [key: string]: CacheEntry }
}

export function getRelayUiKitData(): RelayUiKitData {
  if (typeof window === 'undefined')
    return { acceptedUnverifiedTokens: [], genericCache: {} }

  let data: RelayUiKitData = {
    acceptedUnverifiedTokens: [],
    genericCache: {}
  }
  try {
    const localStorageData = localStorage.getItem(RELAY_UI_KIT_KEY)
    data = localStorageData ? JSON.parse(localStorageData) : data
    // Ensure genericCache exists if loaded data doesn't have it
    if (!data.genericCache) {
      data.genericCache = {}
    }
  } catch (e) {
    console.warn('Failed to get RelayKitUIData', e)
  }
  return data
}

export function setRelayUiKitData(newData: Partial<RelayUiKitData>): void {
  if (typeof window === 'undefined') return

  const currentData = getRelayUiKitData()
  // Deep merge generic cache if both exist
  const updatedGenericCache = {
    ...(currentData.genericCache || {}),
    ...(newData.genericCache || {})
  }
  const updatedData = {
    ...currentData,
    ...newData,
    genericCache: updatedGenericCache
  }
  try {
    // Clean expired entries before saving
    if (updatedData.genericCache) {
      const now = Date.now()
      Object.keys(updatedData.genericCache).forEach((key) => {
        if (updatedData.genericCache![key].expiresAt <= now) {
          delete updatedData.genericCache![key]
        }
      })
    }
    localStorage.setItem(RELAY_UI_KIT_KEY, JSON.stringify(updatedData))
  } catch (e) {
    console.warn('Failed to update RelayKitUIData', e)
  }
}

/**
 * Get a value from the generic cache.
 * @param key - The unique key for the cache entry.
 * @returns The cached value (as string), or null if it doesn't exist or is expired.
 */
export function getCacheEntry(key: string): string | null {
  const data = getRelayUiKitData()
  const cache = data.genericCache?.[key]

  if (cache && cache.expiresAt > Date.now()) {
    return cache.value
  } else if (cache) {
    // Optional: Clean up the specific expired entry immediately
    const currentCache = data.genericCache || {}
    delete currentCache[key]
    setRelayUiKitData({ genericCache: currentCache })
  }
  return null
}

/**
 * Set a value in the generic cache.
 * @param key - The unique key for the cache entry.
 * @param value - The value to set (will be converted to string).
 * @param ttlMinutes - The time to live for the cache entry in minutes.
 */
export function setCacheEntry(
  key: string,
  value: bigint | string | number, // Allow various types that can be stringified
  ttlMinutes: number = DEFAULT_CACHE_TTL_MINUTES
): void {
  const data = getRelayUiKitData()
  const newCache = data.genericCache || {}
  newCache[key] = {
    value: value.toString(),
    expiresAt: Date.now() + ttlMinutes * 60 * 1000
  }
  setRelayUiKitData({ genericCache: newCache })
}

export const alreadyAcceptedToken = (token: Token) => {
  const tokenKey = `${token.chainId}:${token.address}`
  const relayUiKitData = getRelayUiKitData()
  // Ensure acceptedUnverifiedTokens exists before accessing includes
  return relayUiKitData.acceptedUnverifiedTokens?.includes(tokenKey) ?? false
}
