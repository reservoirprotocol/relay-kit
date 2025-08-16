import type { RelayChain } from '@relayprotocol/relay-sdk'
import type { Token } from '../types/index.js'

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

const POPULAR_CHAIN_IDS = new Set([1, 42161, 8453, 792703809]) // Ethereum, Arbitrum, Base, Solana

type ChainOption = RelayChain | { id: undefined; name: string }

type GroupedChains = {
  allChainsOption?: { id: undefined; name: string }
  popularChains: RelayChain[]
  alphabeticalChains: RelayChain[]
}

export const groupChains = (
  chains: ChainOption[],
  popularChainIds?: number[]
): GroupedChains => {
  const priorityIds = new Set(popularChainIds || Array.from(POPULAR_CHAIN_IDS))
  const allChainsOption = chains.find((chain) => chain.id === undefined) as
    | { id: undefined; name: string }
    | undefined
  const otherChains = chains.filter(
    (chain) => chain.id !== undefined
  ) as RelayChain[]

  const popularChains = otherChains
    .filter(
      (chain) =>
        (chain.id && priorityIds.has(chain.id)) ||
        ('tags' in chain && chain.tags && chain.tags.length > 0)
    )
    .sort((a, b) => {
      const aHasTags = 'tags' in a && a.tags && a.tags.length > 0
      const bHasTags = 'tags' in b && b.tags && b.tags.length > 0
      if (aHasTags && !bHasTags) return -1
      if (!aHasTags && bHasTags) return 1

      return a.displayName.localeCompare(b.displayName)
    })

  return {
    allChainsOption,
    popularChains,
    alphabeticalChains: otherChains.sort((a, b) =>
      a.displayName.localeCompare(b.displayName)
    )
  }
}

export const sortChains = (chains: RelayChain[]) => {
  return chains.sort((a, b) => {
    // First sort by tags
    if ((a.tags?.length || 0) > 0 && (b.tags?.length || 0) === 0) return -1
    if ((a.tags?.length || 0) === 0 && (b.tags?.length || 0) > 0) return 1
    if ((a.tags?.length || 0) > 0 && (b.tags?.length || 0) > 0) return 0

    // Then sort by priority chains
    const aIsPriority = POPULAR_CHAIN_IDS.has(a.id)
    const bIsPriority = POPULAR_CHAIN_IDS.has(b.id)
    if (aIsPriority && !bIsPriority) return -1
    if (!aIsPriority && bIsPriority) return 1
    if (aIsPriority && bIsPriority) {
      return (
        Array.from(POPULAR_CHAIN_IDS).indexOf(a.id) -
        Array.from(POPULAR_CHAIN_IDS).indexOf(b.id)
      )
    }

    // Finally sort remaining chains alphabetically by displayName
    return a.displayName.localeCompare(b.displayName)
  })
}

export const getInitialChainFilter = (
  chainFilterOptions: RelayChain[],
  context: 'from' | 'to',
  depositAddressOnly: boolean,
  token?: Token
) => {
  const defaultFilter = { id: undefined, name: 'All Chains' }

  // If there is only one chain, return it
  if (chainFilterOptions.length === 1) {
    return chainFilterOptions[0]
  }

  if (depositAddressOnly) {
    if (token) {
      return (
        chainFilterOptions.find((chain) => chain.id === token.chainId) ||
        defaultFilter
      )
    }
    return chainFilterOptions[0]
  }

  if (token === undefined || context === 'from') {
    return defaultFilter
  }

  return (
    chainFilterOptions.find((chain) => chain.id === token.chainId) ||
    defaultFilter
  )
}
