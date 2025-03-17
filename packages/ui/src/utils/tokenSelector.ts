import type { RelayChain } from '@reservoir0x/relay-sdk'

export const isChainLocked = (
  chainId: number | undefined,
  lockChainId: number | undefined,
  otherTokenChainId: number | undefined,
  lockToken: boolean
) => {
  if (lockToken) {
    return true
  }
  if (lockChainId === undefined) return false

  // If this token is on the locked chain, only lock it if the other token isn't
  if (chainId === lockChainId) {
    return otherTokenChainId !== lockChainId || lockToken
  }

  return false
}

const PRIORITY_CHAIN_IDS = new Set([1, 42161, 8453, 792703809]) // Ethereum, Arbitrum, Base, Solana

export const sortChains = (chains: RelayChain[]) => {
  return chains.sort((a, b) => {
    // First sort by tags
    if ((a.tags?.length || 0) > 0 && (b.tags?.length || 0) === 0) return -1
    if ((a.tags?.length || 0) === 0 && (b.tags?.length || 0) > 0) return 1
    if ((a.tags?.length || 0) > 0 && (b.tags?.length || 0) > 0) return 0

    // Then sort by priority chains
    const aIsPriority = PRIORITY_CHAIN_IDS.has(a.id)
    const bIsPriority = PRIORITY_CHAIN_IDS.has(b.id)
    if (aIsPriority && !bIsPriority) return -1
    if (!aIsPriority && bIsPriority) return 1
    if (aIsPriority && bIsPriority) {
      return (
        Array.from(PRIORITY_CHAIN_IDS).indexOf(a.id) -
        Array.from(PRIORITY_CHAIN_IDS).indexOf(b.id)
      )
    }

    // Finally sort remaining chains alphabetically by displayName
    return a.displayName.localeCompare(b.displayName)
  })
}
