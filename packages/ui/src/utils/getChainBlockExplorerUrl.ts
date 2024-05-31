import type { RelayChain } from '@reservoir0x/relay-sdk'

const getChainBlockExplorerUrl = (chainId?: number, chains?: RelayChain[]) => {
  let blockExplorerUrl =
    chains?.find((chain) => chain.id === chainId)?.viemChain?.blockExplorers
      ?.default?.url || 'https://etherscan.io'

  // Ensure the URL does not end with a trailing slash
  if (blockExplorerUrl.endsWith('/')) {
    blockExplorerUrl = blockExplorerUrl.slice(0, -1)
  }

  return blockExplorerUrl
}

export default getChainBlockExplorerUrl
