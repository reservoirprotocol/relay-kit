import type { Chain } from 'viem'
import type { RelayChain, paths } from '../types/index.js'
import {
  arbitrum,
  arbitrumNova,
  arbitrumSepolia,
  base,
  baseGoerli,
  goerli,
  mainnet,
  optimism,
  sepolia,
  zora,
  zoraSepolia,
} from 'viem/chains'

type RelayAPIChain = Required<
  NonNullable<
    paths['/chains']['get']['responses']['200']['content']['application/json']['chains']
  >['0']
>

export const configureViemChain = (
  chain: RelayAPIChain
): RelayChain & Required<Pick<RelayChain, 'viemChain'>> => {
  let viemChain: Chain
  const staticChains = [
    // mainnets
    mainnet,
    arbitrumNova,
    arbitrum,
    base,
    optimism,
    zora,
    //testnets
    sepolia,
    goerli,
    baseGoerli,
    zoraSepolia,
    arbitrumSepolia,
  ]
  const staticChain = staticChains.find(({ id }) => id === chain.id)
  if (staticChain) {
    viemChain = staticChain
  } else {
    viemChain = {
      id: chain.id,
      name: chain.displayName,
      network: chain.name,
      nativeCurrency: {
        name: chain.currency.name ?? 'Ethereum',
        decimals: chain.currency.decimals ?? 18,
        symbol: chain.currency.symbol ?? 'ETH',
      },
      rpcUrls: {
        default: {
          http: [chain.httpRpcUrl],
          webSocket: [chain.wsRpcUrl],
        },
        public: {
          http: [chain.httpRpcUrl],
          webSocket: [chain.wsRpcUrl],
        },
      },
      blockExplorers: {
        etherscan: {
          name: chain.explorerName,
          url: chain.explorerUrl,
        },
        default: {
          name: chain.explorerName,
          url: chain.explorerUrl,
        },
      },
    } as const satisfies Chain
  }

  return {
    ...chain,
    viemChain,
    icon: {
      dark: `https://assets.relay.link/icons/${chain.id}/dark.png`,
      light: `https://assets.relay.link/icons/${chain.id}/light.png`,
    },
  }
}

export const convertViemChainToRelayChain = (chain: Chain): RelayChain => {
  return {
    id: chain.id,
    name: chain.network ?? chain.name.replace(' ', '-'),
    displayName: chain.name,
    httpRpcUrl:
      chain.rpcUrls.default && chain.rpcUrls.default && chain.rpcUrls.default
        ? chain.rpcUrls.default.http[0] ?? ''
        : '',
    wsRpcUrl:
      chain.rpcUrls && chain.rpcUrls.default.webSocket
        ? chain.rpcUrls.default.webSocket[0] ?? ''
        : '',
    icon: {
      dark: `https://assets.relay.link/icons/${chain.id}/dark.png`,
      light: `https://assets.relay.link/icons/${chain.id}/light.png`,
    },
    currency: chain.nativeCurrency,
    explorerUrl: chain.blockExplorers?.default.url ?? '',
    depositEnabled: true,
    viemChain: chain,
  }
}
