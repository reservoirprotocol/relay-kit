import { Chain } from 'viem'

export const calderaTestnet = {
  id: 4654,
  name: 'Caldera Testnet',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://creator-testnet.rpc.caldera.xyz/http'],
      webSocket: undefined
    },
    public: {
      http: ['https://creator-testnet.rpc.caldera.xyz/http'],
      webSocket: undefined
    }
  },
  blockExplorers: {
    default: {
      name: 'Caldera Explorer',
      url: 'https://creator-testnet.explorer.caldera.xyz'
    }
  },
  testnet: true,
} as const satisfies Chain
