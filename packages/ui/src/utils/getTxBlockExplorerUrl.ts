import type { RelayChain } from '@reservoir0x/relay-sdk'
import getChainBlockExplorerUrl from './getChainBlockExplorerUrl.js'

const appendQueryParams = (url: string, params: Record<string, any>) => {
  if (params) {
    const queryParams = new URLSearchParams(params)
    return `${url}?${queryParams.toString()}`
  }
  return url
}

export const getTxBlockExplorerUrl = (
  chainId?: number,
  chains?: RelayChain[],
  txHash?: string
) => {
  const chain = chains?.find((chain) => chain.id === chainId)
  let blockExplorerUrl = getChainBlockExplorerUrl(chainId, chains)

  if (txHash) {
    blockExplorerUrl = `${blockExplorerUrl}/tx/${txHash}`
  }

  blockExplorerUrl = appendQueryParams(
    blockExplorerUrl,
    //@ts-ignore: TODO until we update the sdk
    chain?.explorerQueryParams
  )

  return blockExplorerUrl
}
