import type { Token } from '../types'

const RELAY_UI_KIT_KEY = 'relayUiKitData'

interface RelayUiKitData {
  acceptedUnverifiedTokens: string[]
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
