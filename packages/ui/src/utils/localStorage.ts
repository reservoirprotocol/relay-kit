const RELAY_UI_KIT_KEY = 'relayUiKitData'

interface RelayUiKitData {
  acceptedUnverifiedTokens: string[]
}

export function getRelayUiKitData(): RelayUiKitData {
  if (typeof window === 'undefined') return { acceptedUnverifiedTokens: [] }

  const storedData = localStorage.getItem(RELAY_UI_KIT_KEY)
  return storedData ? JSON.parse(storedData) : { acceptedUnverifiedTokens: [] }
}

export function setRelayUiKitData(newData: Partial<RelayUiKitData>): void {
  if (typeof window === 'undefined') return

  const currentData = getRelayUiKitData()
  const updatedData = { ...currentData, ...newData }
  localStorage.setItem(RELAY_UI_KIT_KEY, JSON.stringify(updatedData))
}
