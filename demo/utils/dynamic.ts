import { GenericNetwork } from '@dynamic-labs/types'
import { RelayChain } from '@reservoir0x/relay-sdk'

export const convertRelayChainToDynamicNetwork = (
  chain: RelayChain
): GenericNetwork => {
  return {
    blockExplorerUrls: [chain.explorerUrl ?? 'https://etherscan.io'],
    chainId: chain.id,
    chainName: chain.name,
    iconUrls:
      chain.icon?.light || chain.icon?.dark
        ? [chain.icon?.light ?? '', chain.icon?.dark ?? '']
        : [],
    name: chain.name,
    nativeCurrency: {
      decimals: chain.currency?.decimals ?? 18,
      name: chain.currency?.name ?? 'ETH',
      symbol: chain.currency?.symbol ?? 'ETH'
    },
    networkId: chain.id,
    rpcUrls: chain.httpRpcUrl ? [chain.httpRpcUrl] : [],
    vanityName: chain.displayName
  }
}
